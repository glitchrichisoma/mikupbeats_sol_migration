/** PoL (Proof of Listening) frontend type definitions */

export type BadgeTier = "bronze" | "silver" | "gold";

export interface PoLResetConfig {
  resetEnabled: boolean;
  resetIntervalDays: number; // 1–30
  resetTimeOfDayHours: number; // 0–23 UTC
}

export interface VerifiedListenerBadge {
  tier: BadgeTier;
  earnedAt: number; // timestamp ms
  confidenceAtEarning: number; // 0-100
  sessionCount: number;
}

export interface PoLConfig {
  enabled: boolean;
  minConfidenceThreshold: number; // 0-100, below this no reward
  rewardMultiplier: number; // 0.0 to 2.0
  bronzeThreshold: number; // default 1
  silverThreshold: number; // default 34
  goldThreshold: number; // default 67
}

export interface PoLSessionRecord {
  sessionId: string;
  contentId: string;
  contentType: string;
  confidenceScore: number;
  tokensEarned: number;
  timestamp: number;
  playbackDurationMs: number;
}
