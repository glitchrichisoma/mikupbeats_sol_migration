/**
 * PoL (Proof of Listening) Phase 1 — Playback Continuity Tracker
 *
 * Tracks genuine listening signals without audio fingerprinting:
 *   - playbackDurationMs: accumulated real playback time
 *   - tabActivityScore: ratio of time tab was visible vs total session
 *   - playbackContinuityScore: penalised by rapid pause/resume cycles
 *
 * confidenceScore = (playbackContinuityScore * 0.6 + tabActivityScore * 0.4) * 100
 *   → returned as 0‒100 float
 */

export function generateSessionId(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("-")
    .replace(/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/, "$1-$2-$3-$4-$5");
}

export interface PoLSessionResult {
  sessionId: string;
  contentId: string;
  contentType: string;
  confidenceScore: number;
  playbackDurationMs: number;
  tabActivityScore: number;
  playbackContinuityScore: number;
}

export class PoLSessionTracker {
  private sessionId = "";
  private contentId = "";
  private contentType = "";

  // Timing
  private sessionStartMs = 0;
  private totalSessionMs = 0;

  // Tab visibility
  private tabHiddenMs = 0;
  private tabHiddenSince: number | null = null;

  // Playback continuity
  private playbackStartMs = 0;
  private totalPlaybackMs = 0;
  private isPlaying = false;

  // Anti-fast-skip: count pause/resumes in rolling 30s windows
  private pauseTimestamps: number[] = [];
  private continuityPenalty = 0; // accumulated multiplier reduction

  private visibilityHandler: (() => void) | null = null;
  private active = false;

  start(contentId: string, contentType: string): void {
    this.reset();
    this.sessionId = generateSessionId();
    this.contentId = contentId;
    this.contentType = contentType;
    this.sessionStartMs = Date.now();
    this.active = true;

    // Tab visibility tracking
    this.visibilityHandler = () => {
      if (document.visibilityState === "hidden") {
        this.tabHiddenSince = Date.now();
      } else {
        if (this.tabHiddenSince !== null) {
          this.tabHiddenMs += Date.now() - this.tabHiddenSince;
          this.tabHiddenSince = null;
        }
      }
    };
    document.addEventListener("visibilitychange", this.visibilityHandler);

    // Mark as playing immediately
    this.resumePlayback();
  }

  resumePlayback(): void {
    if (!this.active || this.isPlaying) return;
    this.isPlaying = true;
    this.playbackStartMs = Date.now();

    // Anti-fast-skip: track resume events
    const now = Date.now();
    this.pauseTimestamps = this.pauseTimestamps.filter((t) => now - t < 30_000);
    this.pauseTimestamps.push(now);

    // If more than 3 resume events in the last 30s, apply continuity penalty
    if (this.pauseTimestamps.length > 3) {
      this.continuityPenalty = Math.min(
        0.5,
        this.continuityPenalty + 0.1 * (this.pauseTimestamps.length - 3),
      );
    }
  }

  pausePlayback(): void {
    if (!this.active || !this.isPlaying) return;
    this.isPlaying = false;
    if (this.playbackStartMs > 0) {
      this.totalPlaybackMs += Date.now() - this.playbackStartMs;
      this.playbackStartMs = 0;
    }
  }

  stop(): PoLSessionResult {
    if (!this.active) {
      return {
        sessionId: this.sessionId || generateSessionId(),
        contentId: this.contentId,
        contentType: this.contentType,
        confidenceScore: 0,
        playbackDurationMs: 0,
        tabActivityScore: 0,
        playbackContinuityScore: 0,
      };
    }

    // Finalise playback duration
    if (this.isPlaying && this.playbackStartMs > 0) {
      this.totalPlaybackMs += Date.now() - this.playbackStartMs;
    }

    // Finalise hidden time
    if (this.tabHiddenSince !== null) {
      this.tabHiddenMs += Date.now() - this.tabHiddenSince;
    }

    const totalSessionMs = Math.max(1, Date.now() - this.sessionStartMs);
    this.totalSessionMs = totalSessionMs;

    // ── Tab activity score ──────────────────────────────────────────────────
    // Penalise if tab was hidden > 50% of session time
    const hiddenRatio = this.tabHiddenMs / totalSessionMs;
    let tabActivityScore: number;
    if (hiddenRatio > 0.5) {
      // Heavy penalty: scale from 0.5 down to 0.0 as hidden ratio goes 0.5→1.0
      tabActivityScore = Math.max(0, 1 - hiddenRatio * 1.5);
    } else {
      tabActivityScore = 1 - hiddenRatio;
    }

    // ── Playback continuity score ───────────────────────────────────────────
    const playbackRatio = Math.min(1, this.totalPlaybackMs / totalSessionMs);
    let playbackContinuityScore = playbackRatio * (1 - this.continuityPenalty);
    playbackContinuityScore = Math.max(0, Math.min(1, playbackContinuityScore));

    // ── Confidence score ────────────────────────────────────────────────────
    const confidenceScore = Math.round(
      (playbackContinuityScore * 0.6 + tabActivityScore * 0.4) * 100,
    );

    // Cleanup
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
    }
    this.active = false;

    return {
      sessionId: this.sessionId,
      contentId: this.contentId,
      contentType: this.contentType,
      confidenceScore,
      playbackDurationMs: this.totalPlaybackMs,
      tabActivityScore,
      playbackContinuityScore,
    };
  }

  reset(): void {
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }
    this.sessionId = "";
    this.contentId = "";
    this.contentType = "";
    this.sessionStartMs = 0;
    this.totalSessionMs = 0;
    this.tabHiddenMs = 0;
    this.tabHiddenSince = null;
    this.playbackStartMs = 0;
    this.totalPlaybackMs = 0;
    this.isPlaying = false;
    this.pauseTimestamps = [];
    this.continuityPenalty = 0;
    this.active = false;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getCurrentConfidence(): number {
    if (!this.active) return 0;
    const now = Date.now();
    const elapsed = Math.max(1, now - this.sessionStartMs);
    let currentPlayback = this.totalPlaybackMs;
    if (this.isPlaying && this.playbackStartMs > 0) {
      currentPlayback += now - this.playbackStartMs;
    }
    const hiddenMs =
      this.tabHiddenMs +
      (this.tabHiddenSince !== null ? now - this.tabHiddenSince : 0);
    const hiddenRatio = hiddenMs / elapsed;
    const tabScore =
      hiddenRatio > 0.5 ? Math.max(0, 1 - hiddenRatio * 1.5) : 1 - hiddenRatio;
    const playbackRatio = Math.min(1, currentPlayback / elapsed);
    const contScore = Math.max(0, playbackRatio * (1 - this.continuityPenalty));
    return Math.round((contScore * 0.6 + tabScore * 0.4) * 100);
  }
}
