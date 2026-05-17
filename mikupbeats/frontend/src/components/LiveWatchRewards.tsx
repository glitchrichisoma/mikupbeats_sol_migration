import { useQueryClient } from "@tanstack/react-query";
import { Clock, Radio, Tv, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDailyCapStatus,
  useEarnTokens,
  useGetRewardRateConfig,
} from "../hooks/useQueries";
import { showMusicRewardToast } from "./MusicRewardToast";

// Fallback milestones: [watchSeconds, tokensEarned, label]
const FALLBACK_MILESTONES: [number, number, string][] = [
  [5 * 60, 2, "5 min watched! +2 MIK97 earned"],
  [15 * 60, 5, "15 min watched! +5 MIK97 earned"],
  [30 * 60, 10, "30 min watched! +10 MIK97 earned — session complete!"],
];

const SESSION_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown between sessions
const HEARTBEAT_INTERVAL_MS = 10_000; // check every 10s for milestone logic
const LIVE_DAILY_CAP_FALLBACK = 30;

// Per-session cooldown key in sessionStorage
const SESSION_KEY = "mik97_live_watch_session";
interface StoredSession {
  startedAt: number;
  totalSecondsWatched: number;
  milestonesReached: number[]; // seconds values of reached milestones
  sessionEndedAt?: number;
}

function getStoredSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function saveSession(s: StoredSession) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

interface LiveWatchRewardsProps {
  /** Whether the YouTube embed is currently configured (embedUrl is not null) */
  streamActive: boolean;
}

export default function LiveWatchRewards({
  streamActive,
}: LiveWatchRewardsProps) {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const earnTokens = useEarnTokens();
  const { data: capStatus, refetch: refetchCap } = useDailyCapStatus();
  const { data: rewardRateConfig } = useGetRewardRateConfig();
  const queryClient = useQueryClient();

  // Build dynamic milestones from config, falling back to hardcoded defaults
  const MILESTONES: [number, number, string][] = useMemo(() => {
    if (rewardRateConfig && rewardRateConfig.liveWatchMilestones.length > 0) {
      return rewardRateConfig.liveWatchMilestones.map(([secs, toks]) => {
        const s = Number(secs);
        const t = Number(toks);
        const mins = Math.floor(s / 60);
        return [s, t, `${mins} min watched! +${t} MIK97 earned`] as [
          number,
          number,
          string,
        ];
      });
    }
    return FALLBACK_MILESTONES;
  }, [rewardRateConfig]);

  const liveEarned = capStatus ? Number(capStatus.liveEarned) : 0;
  const liveCap = capStatus
    ? Number(capStatus.liveCap)
    : LIVE_DAILY_CAP_FALLBACK;
  const dailyCapReached = liveEarned >= liveCap;

  // Session state
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [milestonesReached, setMilestonesReached] = useState<number[]>([]);
  const [inCooldown, setInCooldown] = useState(false);
  const [cooldownMinutes, setCooldownMinutes] = useState(0);

  const sessionRef = useRef<StoredSession | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const earnRef = useRef(earnTokens.mutateAsync);
  earnRef.current = earnTokens.mutateAsync;

  // Check cooldown state from sessionStorage on mount
  useEffect(() => {
    const stored = getStoredSession();
    if (stored?.sessionEndedAt) {
      const elapsed = Date.now() - stored.sessionEndedAt;
      if (elapsed < SESSION_COOLDOWN_MS) {
        setInCooldown(true);
        setCooldownMinutes(Math.ceil((SESSION_COOLDOWN_MS - elapsed) / 60_000));
        sessionRef.current = stored;
        setSessionSeconds(stored.totalSecondsWatched);
        setMilestonesReached(stored.milestonesReached);
      } else {
        // Cooldown expired — clear old session
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const awardMilestone = useCallback(
    async (milestoneSeconds: number, tokens: number, label: string) => {
      if (!isAuthenticated) return;
      try {
        await earnRef.current({
          category: "live",
          points: BigInt(tokens * 100), // 100 points = 1 MIK97
          gameType: null,
          description: label,
        });
        showMusicRewardToast({ amount: tokens, type: "earned" });
        queryClient.invalidateQueries({ queryKey: ["userWallet"] });
        refetchCap();
      } catch {
        // cap reached or error — show cap toast
        showMusicRewardToast({ amount: 0, type: "cap_reached" });
      }

      setMilestonesReached((prev) => {
        const updated = [...prev, milestoneSeconds];
        if (sessionRef.current) {
          sessionRef.current.milestonesReached = updated;
          saveSession(sessionRef.current);
        }
        return updated;
      });
    },
    [isAuthenticated, queryClient, refetchCap],
  );

  // Start/stop the watch timer
  useEffect(() => {
    const shouldTrack =
      isAuthenticated && streamActive && !inCooldown && !dailyCapReached;

    if (!shouldTrack) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Init session if not started
    if (!sessionRef.current) {
      const now = Date.now();
      const fresh: StoredSession = {
        startedAt: now,
        totalSecondsWatched: 0,
        milestonesReached: [],
      };
      sessionRef.current = fresh;
      saveSession(fresh);
    }

    intervalRef.current = setInterval(() => {
      // Pause if tab is hidden (Page Visibility API anti-abuse)
      if (document.visibilityState !== "visible") return;

      const session = sessionRef.current;
      if (!session) return;

      session.totalSecondsWatched += HEARTBEAT_INTERVAL_MS / 1000;
      saveSession(session);
      setSessionSeconds(session.totalSecondsWatched);

      // Check milestones
      for (const [secs, tokens, label] of MILESTONES) {
        if (
          session.totalSecondsWatched >= secs &&
          !session.milestonesReached.includes(secs)
        ) {
          awardMilestone(secs, tokens, label);
        }
      }

      // End session at max milestone (30 min)
      const maxSecs = MILESTONES[MILESTONES.length - 1][0];
      if (session.totalSecondsWatched >= maxSecs) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        session.sessionEndedAt = Date.now();
        saveSession(session);
        setInCooldown(true);
        setCooldownMinutes(Math.ceil(SESSION_COOLDOWN_MS / 60_000));
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    isAuthenticated,
    streamActive,
    inCooldown,
    dailyCapReached,
    awardMilestone,
    MILESTONES,
  ]);

  // End session on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (sessionRef.current && !sessionRef.current.sessionEndedAt) {
        sessionRef.current.sessionEndedAt = Date.now();
        saveSession(sessionRef.current);
      }
    };
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  // Find next milestone
  const nextMilestone = MILESTONES.find(
    ([secs]) => !milestonesReached.includes(secs),
  );
  const nextMilestoneIn = nextMilestone
    ? Math.max(0, Math.ceil((nextMilestone[0] - sessionSeconds) / 60))
    : null;

  const minutesWatched = Math.floor(sessionSeconds / 60);
  const secsDisplay = Math.floor(sessionSeconds % 60);

  return (
    <div
      className="rounded-xl border bg-card px-4 py-3 flex flex-wrap items-center gap-4"
      style={{ borderColor: "rgba(169,112,255,0.25)" }}
      data-ocid="live.reward_widget"
    >
      {/* Icon + label */}
      <div className="flex items-center gap-2 shrink-0">
        <Zap className="h-4 w-4 text-[#a970ff]" />
        <span className="text-sm font-semibold text-[#a970ff]">
          MIK97 Live Rewards
        </span>
      </div>

      {/* Content */}
      {!isAuthenticated ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Radio className="h-3.5 w-3.5" />
          <span>Log in to earn MIK97 while watching</span>
        </div>
      ) : dailyCapReached ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">Daily live reward cap reached</span>
          <span className="text-xs bg-muted rounded px-1.5 py-0.5">
            {liveEarned}/{liveCap} MIK97
          </span>
        </div>
      ) : inCooldown ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Next session available in {cooldownMinutes} min</span>
        </div>
      ) : !streamActive ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Tv className="h-3.5 w-3.5" />
          <span>Start watching a live stream to earn rewards</span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {/* Watch time */}
          <span className="text-foreground">
            Watching:{" "}
            <span className="font-medium text-[#a970ff]">
              {minutesWatched}m{" "}
              {secsDisplay < 10 ? `0${secsDisplay}` : secsDisplay}s
            </span>
          </span>

          {/* Divider */}
          <span className="text-border">|</span>

          {/* Today's live earnings */}
          <span className="text-muted-foreground">
            Live rewards today:{" "}
            <span className="font-medium text-foreground">
              {liveEarned}/{liveCap} MIK97
            </span>
          </span>

          {/* Next milestone */}
          {nextMilestone && nextMilestoneIn !== null && (
            <>
              <span className="text-border">|</span>
              <span className="text-muted-foreground">
                Next reward in{" "}
                <span className="font-medium text-foreground">
                  {nextMilestoneIn} min
                </span>
              </span>
            </>
          )}

          {/* All milestones reached in session */}
          {!nextMilestone && milestonesReached.length > 0 && (
            <>
              <span className="text-border">|</span>
              <span className="font-medium text-[#a970ff]">
                All milestones reached!
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
