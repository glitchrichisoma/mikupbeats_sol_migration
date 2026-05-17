/** PoSP (Proof of Sonic Presence) frontend type definitions */

export type PoSPRoomType = "SonicHash" | "PresenceTracking";

export type PoSPRoomStatus = "Waiting" | "Active" | "Completed" | "Expired";

export interface PoSPRoom {
  id: string;
  title: string;
  hostPrincipal: string;
  roomType: PoSPRoomType;
  status: PoSPRoomStatus;
  contentUrl: string;
  contentType: "Native" | "External";
  capacity: number;
  currentParticipants: number;
  minGroupSize: number;
  durationMinutes: number;
  startedAt?: number; // timestamp ms
  scheduledAt?: number; // timestamp ms
  createdAt: number; // timestamp ms
}

export interface PoSPParticipantSession {
  roomId: string;
  participantPrincipal: string;
  joinedAt: number; // timestamp ms
  lastActiveAt: number; // timestamp ms
  activeTimeMs: number;
  verificationMethod: PoSPRoomType;
  confidenceScore: number; // 0-100
  tokensEarned: number;
  passed: boolean;
}

export interface PoSPConfig {
  layer2Enabled: boolean;
  defaultRoomCapacity: number; // 5-100
  defaultRoomDurationMinutes: number; // 10-180, default 60
  minGroupSize: number; // 2+
  consensusWindowMinutes: number; // 1-10
  nativeRewardRatePerMinute: number; // MIK97 per minute for sonic hash rooms
  externalRewardRatePerMinute: number; // MIK97 per minute for presence rooms
  minActiveTimePercent: number; // 0-100, threshold for reward
  hostFeeEnabled: boolean;
  hostFeeAmount: number; // MIK97 tokens
  autoRoomEnabled: boolean;
  autoRoomPlayCountThreshold: number;
  maxScheduledRoomsPerDay: number;
}

export interface PoSPScheduledRoom {
  id: string;
  title: string;
  contentUrl: string;
  contentType: "Native" | "External";
  scheduledAt: number; // timestamp ms
  durationMinutes: number;
  capacity: number;
  status: "Scheduled" | "Cancelled";
}
