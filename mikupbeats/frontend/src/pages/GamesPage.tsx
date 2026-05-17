import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, Expand, Gamepad2, LogIn, Send, Trophy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { GameScore } from "../backend";
import DinoJumpGame from "../components/DinoJumpGame";
import FlappyBirdGame from "../components/FlappyBirdGame";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDailyCapStatus,
  useGameLeaderboard,
  useGetDailyCapConfig,
  useGetPlatformToggles,
  useGetRewardRateConfig,
  useIsCallerAdmin,
  useSubmitGameScore,
  useUserWallet,
} from "../hooks/useQueries";
import { formatMIK97 } from "../utils/formatTokenAmount";

const ANTI_ABUSE_COOLDOWN_S = 60;

function CapBar({
  earned,
  max,
  label,
}: { earned: number; max: number; label: string }) {
  const pct = Math.min((earned / max) * 100, 100);
  const full = earned >= max;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span
          className={full ? "text-primary font-bold" : "text-muted-foreground"}
        >
          {label}
        </span>
        <span
          className={
            full ? "text-primary font-semibold" : "text-muted-foreground"
          }
        >
          {formatMIK97(earned)} / {formatMIK97(max)} MIK97
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${full ? "bg-accent" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {full && (
        <p className="text-xs text-accent font-medium">
          Daily games cap reached — come back tomorrow!
        </p>
      )}
    </div>
  );
}

function LeaderboardSection({
  gameType,
  title,
}: { gameType: string; title: string }) {
  const { data: scores, isLoading } = useGameLeaderboard(gameType);

  return (
    <div>
      <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        {title} · Best Scores
      </h3>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : !scores || scores.length === 0 ? (
        <div
          data-ocid={`games.${gameType}.leaderboard.empty_state`}
          className="text-center py-6 text-sm text-muted-foreground border border-border rounded-lg bg-muted/20"
        >
          No scores yet — be the first!
        </div>
      ) : (
        <div className="space-y-1.5">
          {scores.slice(0, 10).map((entry: GameScore, i: number) => (
            <div
              key={`${String(entry.timestamp)}-${i}`}
              data-ocid={`games.${gameType}.leaderboard.item.${i + 1}`}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm ${
                i === 0
                  ? "border-primary/40 bg-primary/10"
                  : "border-border bg-muted/20"
              }`}
            >
              <span
                className={`font-bold tabular-nums w-5 shrink-0 ${i === 0 ? "text-primary" : "text-muted-foreground"}`}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-foreground truncate font-medium">
                {entry.displayName || "Anonymous"}
              </span>
              <span
                className={`font-bold tabular-nums ${i === 0 ? "text-primary" : "text-foreground"}`}
              >
                {Number(entry.score).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GamesPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { isLoading: walletLoading } = useUserWallet();
  const { data: capStatus, isLoading: capLoading } = useDailyCapStatus();
  const { data: rewardRateConfig } = useGetRewardRateConfig();
  const { data: dailyCapConfig } = useGetDailyCapConfig();
  const { data: platformToggles } = useGetPlatformToggles();
  const { data: isAdmin } = useIsCallerAdmin();
  const submitScore = useSubmitGameScore();

  // Dynamic config values — null until loaded so we never show stale fallbacks
  const gamesDailyCap = dailyCapConfig ? Number(dailyCapConfig.gamesCap) : 100;
  const jumperRatio = rewardRateConfig
    ? Number(rewardRateConfig.jumperRatio)
    : 200;
  const flappyRatio = rewardRateConfig
    ? Number(rewardRateConfig.flappyRatio)
    : 5;
  // MIK97 per threshold hit — wired directly to admin setting, no hardcoded fallback > 0
  const jumperTokensPerThreshold = rewardRateConfig
    ? Number(rewardRateConfig.jumperTokensPerThreshold)
    : 0; // 0 until loaded — means no tokens credited until config arrives
  const flappyTokensPerThreshold = rewardRateConfig
    ? Number(rewardRateConfig.flappyTokensPerThreshold)
    : 0; // 0 until loaded

  const lastSubmitRef = useRef<Record<string, number>>({});
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});

  // Accumulated pending tokens per game (across multiple rounds)
  const [pendingTokens, setPendingTokens] = useState<Record<string, number>>({
    dino: 0,
    flappy: 0,
  });

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const next: Record<string, number> = {};
      for (const [gType, ts] of Object.entries(lastSubmitRef.current)) {
        const elapsed = Math.floor((now - ts) / 1000);
        const remaining = ANTI_ABUSE_COOLDOWN_S - elapsed;
        if (remaining > 0) next[gType] = remaining;
      }
      setCooldowns(next);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const gamesEarned = capStatus ? Number(capStatus.gamesEarned) : 0;
  const capReached = gamesEarned >= gamesDailyCap;

  // Called each time a game round ends — accumulate tokens locally
  // floor() applies only to the threshold hit count (whole hits); tpt is a Float
  // so the final earned amount can be fractional (e.g. 3 hits × 0.5 MIK97 = 1.5)
  const handleRoundEnd = useCallback(
    (gameType: string, score: number) => {
      if (capReached) return;
      const ratio = gameType === "dino" ? jumperRatio : flappyRatio;
      const tpt =
        gameType === "dino"
          ? jumperTokensPerThreshold
          : flappyTokensPerThreshold;
      // Only floor the hit count — never floor the final token amount
      const thresholdHits = Math.floor(score / ratio);
      const earned = thresholdHits * tpt;
      // Always accumulate (even 0) — never block restart based on earn amount
      setPendingTokens((prev) => ({
        ...prev,
        [gameType]: (prev[gameType] ?? 0) + earned,
      }));
    },
    [
      capReached,
      jumperRatio,
      flappyRatio,
      jumperTokensPerThreshold,
      flappyTokensPerThreshold,
    ],
  );

  // Submit accumulated tokens for a specific game
  const handleSubmit = useCallback(
    (gameType: string) => {
      const pending = pendingTokens[gameType] ?? 0;
      if (pending <= 0) {
        toast.info("No tokens to submit — play a round first!");
        return;
      }

      const now = Date.now();
      const last = lastSubmitRef.current[gameType] ?? 0;
      const elapsed = Math.floor((now - last) / 1000);

      if (elapsed < ANTI_ABUSE_COOLDOWN_S && last !== 0) {
        toast.error(
          `Please wait ${ANTI_ABUSE_COOLDOWN_S - elapsed}s before submitting again`,
        );
        return;
      }

      lastSubmitRef.current[gameType] = now;
      setCooldowns((prev) => ({
        ...prev,
        [gameType]: ANTI_ABUSE_COOLDOWN_S,
      }));
      setIsSubmitting((prev) => ({ ...prev, [gameType]: true }));

      const ratio = gameType === "dino" ? jumperRatio : flappyRatio;
      const tpt =
        gameType === "dino"
          ? jumperTokensPerThreshold
          : flappyTokensPerThreshold;
      // Reverse-calculate the score equivalent so the backend can verify
      const scoreEquivalent =
        tpt > 0 ? (pending / tpt) * ratio : pending * ratio;

      submitScore.mutate(
        { gameType, score: BigInt(Math.round(scoreEquivalent)) },
        {
          onSuccess: (result) => {
            const earned = Number(result.tokensEarned);
            const newBal = Number(result.newBalance);
            const capHit = result.capReached;
            setIsSubmitting((prev) => ({ ...prev, [gameType]: false }));
            setPendingTokens((prev) => ({ ...prev, [gameType]: 0 }));
            if (earned > 0) {
              toast.success(
                `+${formatMIK97(earned)} MIK97 earned! Balance: ${formatMIK97(newBal)} MIK97${capHit ? " · Daily cap reached!" : ""}`,
              );
            } else {
              toast.info(
                "Daily games cap reached — no tokens earned this round.",
              );
            }
          },
          onError: (err: Error) => {
            setIsSubmitting((prev) => ({ ...prev, [gameType]: false }));
            toast.error(err.message || "Failed to submit score");
          },
        },
      );
    },
    [
      pendingTokens,
      jumperRatio,
      flappyRatio,
      jumperTokensPerThreshold,
      flappyTokensPerThreshold,
      submitScore,
    ],
  );

  if (!isAuthenticated) {
    return (
      <div
        data-ocid="games.page"
        className="min-h-screen flex items-center justify-center bg-background px-4"
      >
        <Card className="bg-card border-border max-w-md w-full text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <Gamepad2 className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-xl font-bold text-foreground">
              Sign in to Play
            </h2>
            <p className="text-muted-foreground text-sm">
              Log in with Internet Identity to play games and earn MIK97 tokens.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <LogIn className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Use the Login button in the menu
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mode-based visibility logic (admin always sees full page)
  const gamesMode = platformToggles?.gamesMode ?? "live";

  if (!isAdmin && gamesMode === "hidden") {
    return (
      <div
        data-ocid="games.hidden.page"
        className="min-h-screen flex items-center justify-center bg-background px-4"
      >
        <Card className="bg-card border-border max-w-md w-full text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <Gamepad2 className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">
              Page Not Found
            </h2>
            <p className="text-muted-foreground text-sm">
              This page doesn&apos;t exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin && gamesMode === "comingSoon") {
    return (
      <div
        data-ocid="games.coming_soon.page"
        className="min-h-screen flex items-center justify-center bg-background px-4"
      >
        <div className="max-w-md w-full text-center space-y-6">
          <div className="h-24 w-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
            <Gamepad2 className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              Games
            </h1>
            <p className="text-xl font-bold text-primary">Coming Soon</p>
            <p className="text-muted-foreground text-sm leading-relaxed mt-3">
              MIK97 token rewards for Jumper &amp; Flappy launching soon.
              <br />
              Get ready to earn — be the first on the leaderboard.
            </p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-5 py-4 text-left space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              What&apos;s Coming
            </p>
            <ul className="text-sm text-foreground space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Jumper — dodge obstacles, earn MIK97
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Flappy — fly through pipes, stack tokens
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Global leaderboards with real rewards
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-ocid="games.page"
      className="min-h-screen bg-background px-4 py-8"
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Gamepad2 className="h-8 w-8 text-primary" />
            Earn MIK97 Playing Games
          </h1>
          <p className="text-muted-foreground text-sm">
            {rewardRateConfig ? (
              <>
                Jumper: every {formatMIK97(jumperRatio)} pts ={" "}
                {formatMIK97(jumperTokensPerThreshold)} MIK97 · Flappy: every{" "}
                {formatMIK97(flappyRatio)} pts ={" "}
                {formatMIK97(flappyTokensPerThreshold)} MIK97 · Daily cap:{" "}
                {formatMIK97(gamesDailyCap)} MIK97
              </>
            ) : (
              "Loading reward rates…"
            )}
          </p>
        </div>

        {/* Daily Cap Progress */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              Today's Games Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {walletLoading || capLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <CapBar
                earned={gamesEarned}
                max={gamesDailyCap}
                label="Games Earned Today"
              />
            )}
          </CardContent>
        </Card>

        {/* Cap reached banner */}
        {capReached && (
          <div
            data-ocid="games.cap_reached.empty_state"
            className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent font-medium text-center"
          >
            Daily games cap reached ({formatMIK97(gamesDailyCap)} MIK97) — come
            back tomorrow to earn more!
          </div>
        )}

        {/* Games Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Jumper */}
          <Card
            className="bg-card border-border"
            data-ocid="games.dino_jump.card"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Jumper</span>
                <div className="flex items-center gap-2">
                  {cooldowns.dino && (
                    <span className="text-xs text-muted-foreground font-normal">
                      Cooldown: {cooldowns.dino}s
                    </span>
                  )}
                  <a
                    href="/games/dino"
                    data-ocid="games.dino_jump.fullscreen_button"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    <Expand className="h-3 w-3" />
                    Fullscreen
                  </a>
                </div>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Press SPACE or tap to jump · Avoid obstacles ·{" "}
                {rewardRateConfig
                  ? `Every ${formatMIK97(jumperRatio)} pts = ${formatMIK97(jumperTokensPerThreshold)} MIK97`
                  : "Loading reward rate…"}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <DinoJumpGame onRoundEnd={handleRoundEnd} disabled={capReached} />
              {/* Submit bar */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 min-w-0">
                  <Coins
                    className="h-4 w-4 shrink-0"
                    style={{
                      color:
                        (pendingTokens.dino ?? 0) > 0 ? "#c084fc" : "#4c3070",
                    }}
                  />
                  <span
                    className="text-sm font-bold truncate"
                    style={{
                      color:
                        (pendingTokens.dino ?? 0) > 0 ? "#c084fc" : "#6b6080",
                    }}
                  >
                    {(pendingTokens.dino ?? 0) > 0
                      ? `${formatMIK97(pendingTokens.dino ?? 0)} MIK97 pending`
                      : "Play rounds to accumulate tokens"}
                  </span>
                </div>
                <button
                  type="button"
                  data-ocid="games.dino_jump.submit_button"
                  onClick={() => handleSubmit("dino")}
                  disabled={
                    (pendingTokens.dino ?? 0) <= 0 ||
                    isSubmitting.dino ||
                    (cooldowns.dino !== undefined && cooldowns.dino > 0)
                  }
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold shrink-0 transition-all disabled:opacity-40"
                  style={{
                    background:
                      (pendingTokens.dino ?? 0) > 0 && !isSubmitting.dino
                        ? "#7c3aed"
                        : "#2d1f4e",
                    border: "2px solid #7c3aed",
                    color: "#ffffff",
                  }}
                >
                  <Send className="h-3.5 w-3.5" />
                  {isSubmitting.dino ? "Submitting…" : "Submit Score"}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Flappy */}
          <Card
            className="bg-card border-border"
            data-ocid="games.flappy_bird.card"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Flappy</span>
                <div className="flex items-center gap-2">
                  {cooldowns.flappy && (
                    <span className="text-xs text-muted-foreground font-normal">
                      Cooldown: {cooldowns.flappy}s
                    </span>
                  )}
                  <a
                    href="/games/flappy"
                    data-ocid="games.flappy_bird.fullscreen_button"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    <Expand className="h-3 w-3" />
                    Fullscreen
                  </a>
                </div>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Tap anywhere to flap · Fly through pipe gaps ·{" "}
                {rewardRateConfig
                  ? `Every ${formatMIK97(flappyRatio)} pts = ${formatMIK97(flappyTokensPerThreshold)} MIK97`
                  : "Loading reward rate…"}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <FlappyBirdGame
                onRoundEnd={handleRoundEnd}
                disabled={capReached}
              />
              {/* Submit bar */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 min-w-0">
                  <Coins
                    className="h-4 w-4 shrink-0"
                    style={{
                      color:
                        (pendingTokens.flappy ?? 0) > 0 ? "#c084fc" : "#4c3070",
                    }}
                  />
                  <span
                    className="text-sm font-bold truncate"
                    style={{
                      color:
                        (pendingTokens.flappy ?? 0) > 0 ? "#c084fc" : "#6b6080",
                    }}
                  >
                    {(pendingTokens.flappy ?? 0) > 0
                      ? `${formatMIK97(pendingTokens.flappy ?? 0)} MIK97 pending`
                      : "Play rounds to accumulate tokens"}
                  </span>
                </div>
                <button
                  type="button"
                  data-ocid="games.flappy_bird.submit_button"
                  onClick={() => handleSubmit("flappy")}
                  disabled={
                    (pendingTokens.flappy ?? 0) <= 0 ||
                    isSubmitting.flappy ||
                    (cooldowns.flappy !== undefined && cooldowns.flappy > 0)
                  }
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold shrink-0 transition-all disabled:opacity-40"
                  style={{
                    background:
                      (pendingTokens.flappy ?? 0) > 0 && !isSubmitting.flappy
                        ? "#7c3aed"
                        : "#2d1f4e",
                    border: "2px solid #7c3aed",
                    color: "#ffffff",
                  }}
                >
                  <Send className="h-3.5 w-3.5" />
                  {isSubmitting.flappy ? "Submitting…" : "Submit Score"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboards */}
        <Card
          className="bg-card border-border"
          data-ocid="games.leaderboard.card"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Leaderboards · Highest Score Per Player
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LeaderboardSection gameType="dino" title="Jumper" />
              <LeaderboardSection gameType="flappy" title="Flappy" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
