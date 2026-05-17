import { useQueryClient } from "@tanstack/react-query";
import {
  Coins,
  Gamepad2,
  GripVertical,
  LogIn,
  Send,
  Trophy,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { GameScore } from "../backend";
import FlappyBirdGame, {
  type FlappyBirdGameHandle,
} from "../components/FlappyBirdGame";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDailyCapStatus,
  useGameLeaderboard,
  useGetDailyCapConfig,
  useGetRewardRateConfig,
  useSubmitGameScore,
  useUserWallet,
} from "../hooks/useQueries";
import { formatMIK97 } from "../utils/formatTokenAmount";

const ANTI_ABUSE_COOLDOWN_S = 60;

export default function FlappyBirdFullscreen() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: wallet, isLoading: walletLoading } = useUserWallet();
  const {
    data: capStatus,
    isLoading: capLoading,
    refetch: refetchCap,
  } = useDailyCapStatus();
  const { data: leaderboard, isLoading: lbLoading } =
    useGameLeaderboard("flappy");
  const { data: rewardRateConfig } = useGetRewardRateConfig();
  const { data: dailyCapConfig } = useGetDailyCapConfig();
  const submitScore = useSubmitGameScore();
  const queryClient = useQueryClient();

  const gamesDailyCap = dailyCapConfig ? Number(dailyCapConfig.gamesCap) : 100;

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  // Tokens accumulated across rounds (not yet submitted to backend)
  const [pendingTokens, setPendingTokens] = useState(0);
  const [localCapReached, setLocalCapReached] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lastSubmitRef = useRef<number>(0);
  const [cooldownSecs, setCooldownSecs] = useState(0);
  const gameRef = useRef<FlappyBirdGameHandle>(null);

  // Points-per-token ratio and MIK97 per threshold — both from admin config
  const flappyRatio = rewardRateConfig
    ? Number(rewardRateConfig.flappyRatio)
    : 5;
  // 0 until config loads — no tokens credited until admin settings arrive
  const flappyTokensPerThreshold = rewardRateConfig
    ? Number(rewardRateConfig.flappyTokensPerThreshold)
    : 0;

  useEffect(() => {
    if (!isAuthenticated) return;
    queryClient.invalidateQueries({ queryKey: ["dailyCapStatus"] });
    refetchCap();
  }, [isAuthenticated, queryClient, refetchCap]);

  // Countdown cooldown timer
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastSubmitRef.current) / 1000);
      const remaining = Math.max(0, ANTI_ABUSE_COOLDOWN_S - elapsed);
      setCooldownSecs(remaining);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const gamesEarned = capStatus ? Number(capStatus.gamesEarned) : 0;

  const capReached =
    localCapReached !== null
      ? localCapReached
      : !capLoading && gamesEarned >= gamesDailyCap;

  const balance = wallet ? Number(wallet.balance) : 0;

  // Called each time a round ends — accumulate tokens locally
  // floor() applies only to the threshold hit count; tpt is a Float
  const handleRoundEnd = useCallback(
    (_gameType: string, score: number) => {
      if (capReached) return;
      // Only floor the hit count — never floor the final token amount
      const thresholdHits = Math.floor(score / flappyRatio);
      const earned = thresholdHits * flappyTokensPerThreshold;
      // Always accumulate (even 0) — never block restart
      setPendingTokens((prev) => prev + earned);
      // Game auto-resets to dead state; player taps to start next round
    },
    [capReached, flappyRatio, flappyTokensPerThreshold],
  );

  // Submit all accumulated pending tokens to the backend
  const handleSubmit = useCallback(() => {
    if (pendingTokens <= 0) {
      toast.info("No tokens to submit — play a round first!");
      return;
    }
    const now = Date.now();
    const elapsed = Math.floor((now - lastSubmitRef.current) / 1000);
    if (elapsed < ANTI_ABUSE_COOLDOWN_S && lastSubmitRef.current !== 0) {
      toast.error(
        `Please wait ${ANTI_ABUSE_COOLDOWN_S - elapsed}s before submitting again`,
      );
      return;
    }

    lastSubmitRef.current = now;
    setCooldownSecs(ANTI_ABUSE_COOLDOWN_S);
    setIsSubmitting(true);

    // Reverse-calculate score equivalent so backend can verify with its formula
    const scoreEquivalent =
      flappyTokensPerThreshold > 0
        ? (pendingTokens / flappyTokensPerThreshold) * flappyRatio
        : pendingTokens * flappyRatio;

    submitScore.mutate(
      { gameType: "flappy", score: BigInt(Math.round(scoreEquivalent)) },
      {
        onSuccess: (result) => {
          const earned = Number(result.tokensEarned);
          const newBal = Number(result.newBalance);
          const capHit = result.capReached;
          setLocalCapReached(capHit);
          setIsSubmitting(false);
          setPendingTokens(0);
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
          setIsSubmitting(false);
          toast.error(err.message || "Failed to submit score");
        },
      },
    );
  }, [pendingTokens, flappyRatio, flappyTokensPerThreshold, submitScore]);

  // Full-page tap overlay handler — triggers flap via ref
  const handleOverlayTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      gameRef.current?.flap();
    },
    [],
  );

  // ── Vertical drag handle ──────────────────────────────────────────────────
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const dragStartY = useRef<number | null>(null);
  const dragStartOffset = useRef(0);

  const onDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const clientY =
        "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      dragStartY.current = clientY;
      dragStartOffset.current = dragOffsetY;
    },
    [dragOffsetY],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (dragStartY.current === null) return;
      const clientY =
        e instanceof TouchEvent ? e.touches[0].clientY : e.clientY;
      const delta = clientY - dragStartY.current;
      const next = Math.max(
        -200,
        Math.min(200, dragStartOffset.current + delta),
      );
      setDragOffsetY(next);
    };
    const onEnd = () => {
      dragStartY.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div
        data-ocid="flappy_fullscreen.page"
        className="fixed inset-0 bg-background flex items-center justify-center z-50"
        style={{ background: "#0f0d1a" }}
      >
        <div className="text-center space-y-4 px-6">
          <Gamepad2 className="h-12 w-12 text-primary mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Sign in to Play</h2>
          <p className="text-muted-foreground text-sm">
            Log in with Internet Identity to play games and earn MIK97 tokens.
          </p>
          <div className="flex items-center justify-center gap-2">
            <LogIn className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Use the Login button in the menu
            </span>
          </div>
          <a
            href="/games"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            ← Back to Games
          </a>
        </div>
      </div>
    );
  }

  const pct = Math.min((gamesEarned / gamesDailyCap) * 100, 100);
  const hasPending = pendingTokens > 0;

  return (
    <div
      data-ocid="flappy_fullscreen.page"
      className="fixed inset-0 flex flex-col"
      style={{
        background: "#0f0d1a",
        zIndex: 40,
        transform: `translateY(${dragOffsetY}px)`,
        transition:
          dragStartY.current !== null ? "none" : "transform 0.15s ease-out",
      }}
    >
      {/* Top header bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0 border-b"
        style={{ background: "#0a0814", borderColor: "#3b1f6b" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <a
            href="/games"
            data-ocid="flappy_fullscreen.back_link"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-primary border hover:bg-primary/10 transition-colors shrink-0"
            style={{ borderColor: "#3b1f6b" }}
          >
            ← Games
          </a>
          <h1 className="text-sm font-bold text-foreground truncate">Flappy</h1>
          {cooldownSecs > 0 && (
            <span className="text-xs text-muted-foreground shrink-0">
              Submit cooldown: {cooldownSecs}s
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {!walletLoading && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <Coins className="h-3.5 w-3.5" />
              <span>{formatMIK97(balance)} MIK97</span>
            </div>
          )}

          {!capLoading && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatMIK97(gamesEarned)}/{formatMIK97(gamesDailyCap)} today
              </span>
              <div
                className="w-20 h-2 rounded-full overflow-hidden"
                style={{ background: "#2d1f4e" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: capReached ? "#c084fc" : "#7c3aed",
                  }}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            data-ocid="flappy_fullscreen.leaderboard_toggle"
            onClick={() => setShowLeaderboard((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
            style={{
              borderColor: "#3b1f6b",
              background: showLeaderboard ? "#3b1f6b" : "transparent",
              color: "#c084fc",
            }}
          >
            <Trophy className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Cap reached banner */}
      {capReached && (
        <div
          data-ocid="flappy_fullscreen.cap_reached"
          className="px-4 py-2 text-xs font-semibold text-center shrink-0"
          style={{ background: "#2d0a4e", color: "#c084fc" }}
        >
          Daily games cap reached ({formatMIK97(gamesDailyCap)} MIK97) — come
          back tomorrow to earn more!
        </div>
      )}

      {/* Threshold info + Pending tokens + Submit bar */}
      <div
        className="flex items-center justify-between px-4 py-2 shrink-0 border-b"
        style={{ background: "#0a0814", borderColor: "#3b1f6b" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <span>
              Every {formatMIK97(flappyRatio)} pts ={" "}
              {formatMIK97(flappyTokensPerThreshold)} MIK97
            </span>
          </div>
          <div className="h-3 w-px bg-border" />
          <Coins
            className="h-4 w-4 shrink-0"
            style={{ color: hasPending ? "#c084fc" : "#4c3070" }}
          />
          <span
            className="text-sm font-bold truncate"
            style={{ color: hasPending ? "#c084fc" : "#4c3070" }}
          >
            {hasPending
              ? `${formatMIK97(pendingTokens)} MIK97 pending`
              : "Pending: 0 MIK97"}
          </span>
          {hasPending && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              (not yet in wallet)
            </span>
          )}
        </div>
        <button
          type="button"
          data-ocid="flappy_fullscreen.submit_button"
          onClick={handleSubmit}
          disabled={
            !hasPending ||
            isSubmitting ||
            (cooldownSecs > 0 && lastSubmitRef.current !== 0)
          }
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40 shrink-0"
          style={{
            background: hasPending && !isSubmitting ? "#7c3aed" : "#2d1f4e",
            border: "2px solid #7c3aed",
            color: "#ffffff",
            minWidth: "180px",
            justifyContent: "center",
          }}
        >
          <Send className="h-4 w-4" />
          {isSubmitting
            ? "Submitting…"
            : hasPending
              ? `Submit (${formatMIK97(pendingTokens)} MIK97)`
              : "Submit & Earn"}
        </button>
      </div>

      {/* Main: game canvas + drag handle strip + optional leaderboard panel */}
      <div className="flex flex-1 overflow-hidden min-h-0 relative">
        {/* Full-page transparent tap overlay */}
        <div
          data-ocid="flappy_fullscreen.tap_overlay"
          className="absolute inset-0 z-10"
          style={{
            cursor: "pointer",
            touchAction: "none",
            userSelect: "none",
            background: "transparent",
            pointerEvents: "auto",
          }}
          onClick={handleOverlayTap}
          onMouseDown={handleOverlayTap}
          onTouchStart={handleOverlayTap}
          aria-label="Tap anywhere to flap"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.code === "Space" || e.code === "ArrowUp") {
              e.preventDefault();
              gameRef.current?.flap();
            }
          }}
        />

        {/* Game area */}
        <div className="flex-1 flex items-center justify-center p-4 min-w-0 overflow-hidden">
          <div className="w-full h-full flex items-center justify-center">
            <FlappyBirdGame
              ref={gameRef}
              onRoundEnd={handleRoundEnd}
              disabled={capReached}
              onGameStateChange={() => {
                /* state managed locally */
              }}
            />
          </div>
        </div>

        {/* Right-side drag handle strip */}
        <button
          type="button"
          data-ocid="flappy_fullscreen.drag_handle"
          aria-label="Drag to reposition game panel up or down"
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
          className="absolute right-0 top-0 bottom-0 flex items-center justify-center cursor-ns-resize select-none touch-none z-30"
          style={{
            width: "28px",
            background: "#1a1230",
            borderLeft: "1px solid #3b1f6b",
            color: "#7c3aed",
          }}
          title="Drag up/down to reposition"
        >
          <GripVertical className="h-8 w-5" />
        </button>

        {/* Leaderboard side panel */}
        {showLeaderboard && (
          <div
            className="w-72 shrink-0 flex flex-col border-l overflow-hidden relative z-20"
            style={{ background: "#0a0814", borderColor: "#3b1f6b" }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b shrink-0"
              style={{ borderColor: "#3b1f6b" }}
            >
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Flappy · Best Scores
              </h2>
              <button
                type="button"
                data-ocid="flappy_fullscreen.leaderboard_close"
                onClick={() => setShowLeaderboard(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {lbLoading ? (
                <div className="text-xs text-muted-foreground text-center py-6">
                  Loading…
                </div>
              ) : !leaderboard || leaderboard.length === 0 ? (
                <div
                  data-ocid="flappy_fullscreen.leaderboard.empty_state"
                  className="text-xs text-muted-foreground text-center py-8 border rounded-lg"
                  style={{ borderColor: "#3b1f6b" }}
                >
                  No scores yet — be the first!
                </div>
              ) : (
                leaderboard.slice(0, 10).map((entry: GameScore, i: number) => (
                  <div
                    key={`${String(entry.timestamp)}-${i}`}
                    data-ocid={`flappy_fullscreen.leaderboard.item.${i + 1}`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs border"
                    style={{
                      borderColor: i === 0 ? "#7c3aed" : "#3b1f6b",
                      background: i === 0 ? "#2d1f4e" : "#0f0d1a",
                    }}
                  >
                    <span
                      className="font-bold tabular-nums w-4 shrink-0"
                      style={{ color: i === 0 ? "#c084fc" : "#7c6f8e" }}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 text-foreground truncate font-medium">
                      {entry.displayName || "Anonymous"}
                    </span>
                    <span
                      className="font-bold tabular-nums shrink-0"
                      style={{ color: i === 0 ? "#c084fc" : "#a78bbd" }}
                    >
                      {Number(entry.score).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
