import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface AnalyticsData {
    pageVisits: PageVisits;
    dailyVisits: Array<DailyVisit>;
    totalVisits: bigint;
    uniqueVisitors: bigint;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface EarnEntryPublic {
    description: string;
    timestamp: bigint;
    category: EarnCategory;
    amount: number;
}
export interface ForumRewardConfig {
    tokensPerMessage: number;
    isEnabled: boolean;
    rewardEveryNMessages: bigint;
    dailyEarningCap: number;
}
export interface MessageUpdate {
    id: string;
    updatedContent: string;
}
export interface StakeResult {
    apy: number;
    stakeId: string;
    lockEndTime: bigint;
    amountStaked: number;
    lockDays: bigint;
    entryFee: number;
}
export interface StakeRecord {
    id: string;
    startTime: bigint;
    lockEndTime: bigint;
    apyAtStake: number;
    amountStaked: bigint;
    owner: Principal;
    isActive: boolean;
    rewardsClaimed: bigint;
    lockDays: bigint;
}
export interface PoSPRoom {
    id: string;
    status: PoSPRoomStatus;
    title: string;
    expiresAt: bigint;
    contentType: PoSPRoomType;
    currentParticipants: Array<Principal>;
    contentUrl: string;
    createdAt: bigint;
    sessionConfidenceScore: bigint;
    totalRewardPaid: bigint;
    hostFeePaid: bigint;
    hostPrincipal: Principal;
    durationMinutes: bigint;
    isAutoRoom: boolean;
    capacity: bigint;
    scheduledAt?: bigint;
}
export interface Mixtape {
    id: string;
    title: string;
    externalLinks: Array<string>;
    description: string;
    songs: Array<ExternalBlob>;
    approved: boolean;
    uploader: Principal;
    artistName: string;
    coverArt?: ExternalBlob;
}
export interface MusicLink {
    url: string;
    title: string;
    platform: Platform;
    coverArt?: ExternalBlob;
    releaseDate?: string;
}
export interface BonusEarningConfig {
    purchaseCashbackPercent: number;
    mixtapeUploadRewardEnabled: boolean;
    showcaseUploadRewardEnabled: boolean;
    streakTarget: bigint;
    loginBonusTokens: number;
    showcaseUploadBonusTokens: number;
    streakBonusTokens: number;
}
export interface BeatTierDiscountConfig {
    stemsMaxDiscountPercent: number;
    basicMaxDiscountPercent: number;
    premiumDiscountEnabled: boolean;
    stemsDiscountEnabled: boolean;
    exclusiveDiscountEnabled: boolean;
    basicDiscountEnabled: boolean;
    premiumMaxDiscountPercent: number;
    exclusiveMaxDiscountPercent: number;
}
export interface GameScore {
    displayName: string;
    player: Principal;
    score: bigint;
    timestamp: bigint;
    gameType: string;
}
export interface Replay {
    replayUrl: string;
    title: string;
    description: string;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface DollarValueConfig {
    showcaseUsdValue: number;
    mixtapeUsdValue: number;
    musicUsdValue: number;
    bonusUsdValue: number;
    forumUsdValue: number;
    liveUsdValue: number;
    gamesUsdValue: number;
}
export interface RewardSectionToggles {
    flappyRewardsEnabled: boolean;
    forumRewardsEnabled: boolean;
    bonusActionsEnabled: boolean;
    liveRewardsEnabled: boolean;
    mixtapeRewardsEnabled: boolean;
    showcaseRewardsEnabled: boolean;
    gameRewardsEnabled: boolean;
    musicRewardsEnabled: boolean;
}
export interface PreviewEntry {
    duration: bigint;
    assetId: string;
    reference: ExternalBlob;
    description?: string;
    previewType: PreviewType;
}
export interface DailyCapConfig {
    musicCap: number;
    totalDailyCapAcrossAll: number;
    showcaseCap: number;
    bonusCap: number;
    liveCap: number;
    gamesCap: number;
}
export interface BurnEventPublic {
    id: string;
    user: Principal;
    useCase: string;
    beatId?: string;
    timestamp: bigint;
    amount: number;
}
export type Platform = {
    __kind__: "soundcloud";
    soundcloud: null;
} | {
    __kind__: "other";
    other: string;
} | {
    __kind__: "spotify";
    spotify: null;
} | {
    __kind__: "youtube";
    youtube: null;
} | {
    __kind__: "appleMusic";
    appleMusic: null;
};
export interface MixtapeRewardConfig {
    tier3Tokens: number;
    tier4Tokens: number;
    dailyCap: number;
    tier1Tokens: number;
    tier2Tokens: number;
}
export interface LiquidityDeploymentEntry {
    deployedBy: string;
    destinationNote: string;
    entryId: string;
    timestamp: bigint;
    amount: number;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface DailyEarningsByCategory {
    jumperEarned: number;
    flappyEarned: number;
    liveEarned: number;
    lastReset: bigint;
    forumEarned: number;
    mixtapeEarned: number;
    showcaseEarned: number;
    musicEarned: number;
    bonusEarned: number;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TreasuryPool {
    totalAllocated: bigint;
    name: string;
    locked: bigint;
    released: bigint;
    burned: bigint;
}
export interface MigrationLogEntry {
    totalTokensDistributed: bigint;
    triggeredBy: Principal;
    timestamp: bigint;
    totalUsers: bigint;
}
export interface StakingConfig {
    earlyUnstakePenaltyEnabled: boolean;
    tier1Apy: number;
    tier2Apy: number;
    tier3Apy: number;
    earlyUnstakePenaltyBurnPct: number;
    maxStake: number;
    minStake: number;
    isEnabled: boolean;
    earlyUnstakePenaltyRewardsPct: number;
    earlyUnstakePenaltyReservePct: number;
    entryFeePercent: number;
    entryFeeEnabled: boolean;
    earlyUnstakePenaltyPromoPct: number;
    earlyUnstakePenaltyPercent: number;
}
export interface Show {
    title: string;
    date: string;
    time: string;
    description: string;
}
export interface ReleaseAuditEntryView {
    triggeredBy: string;
    timestamp: bigint;
    success: boolean;
    poolName: string;
    amount: number;
    errorMsg?: string;
    reason: string;
}
export interface DailyCapStatus {
    musicCap: number;
    liveEarned: number;
    lastReset: bigint;
    gamesEarned: number;
    liveCap: number;
    musicEarned: number;
    gamesCap: number;
}
export interface PageVisits {
    mva: bigint;
    forum: bigint;
    live: bigint;
    mixtapes: bigint;
    store: bigint;
    musicLinks: bigint;
    showcase: bigint;
}
export interface ReleaseEngineConfig {
    autoReleasePaused: boolean;
    isPaused: boolean;
    autoReleaseEnabled: boolean;
    maxDailyReleaseTokens: bigint;
    scheduledReleaseAmountPerPool: bigint;
    rewardPoolThresholdPercent: bigint;
    maxWeeklyReleaseTokens: bigint;
}
export interface PoSPConfig {
    autoRoomPlayCountThreshold: bigint;
    consensusWindowMinutes: bigint;
    minActiveTimePercent: bigint;
    nativeRewardRatePerMinute: bigint;
    autoRoomEnabled: boolean;
    defaultRoomCapacity: bigint;
    layer2Enabled: boolean;
    hostFeeAmount: bigint;
    externalRewardRatePerMinute: bigint;
    maxScheduledRoomsPerDay: bigint;
    defaultRoomDurationMinutes: bigint;
    hostFeeEnabled: boolean;
    minGroupSize: bigint;
}
export interface PoolActivityEntry {
    action: string;
    initiator: string;
    pool: string;
    txId: bigint;
    rewardsEarned: number;
    timestamp: bigint;
    txType: string;
    amount: number;
}
export interface RewardRateConfig {
    fiveDayCooldownNs: bigint;
    jumperTokensPerThreshold: number;
    musicTrackCompletionTokens: number;
    flappyTokensPerThreshold: number;
    liveWatchMilestones: Array<[bigint, number]>;
    musicAlbumCompletionTokens: number;
    flappyRatio: number;
    jumperRatio: number;
    musicListeningSeconds: bigint;
    musicListeningTokensPerInterval: number;
}
export interface PoSPParticipantSession {
    verified: boolean;
    interactionChecksFailed: bigint;
    interactionChecksPassed: bigint;
    rewardClaimed: boolean;
    lastActiveAt: bigint;
    joinedAt: bigint;
    presenceScore: bigint;
    participant: Principal;
    roomId: string;
    rewardEarned: bigint;
}
export interface UserProfile {
    isCreator: boolean;
    name: string;
}
export interface LiveStream {
    id: string;
    title: string;
    host: string;
    description: string;
    isActive: boolean;
}
export interface RightsFolder {
    freeDownload: boolean;
    sold: boolean;
    googleDriveLink?: string;
    zipFile?: ExternalBlob;
    licenseDocs: Array<LicenseDocEntry>;
    audioFiles: Array<AudioFileEntry>;
    priceInCents: bigint;
    rightsType: RightsType;
}
export interface PoLConfig {
    polEnabled: boolean;
    polMinConfidenceThreshold: bigint;
    silverMin: bigint;
    polRewardMultiplier: number;
    goldMin: bigint;
    bronzeMin: bigint;
}
export interface DailyVisit {
    date: string;
    count: bigint;
}
export interface Beat {
    id: string;
    title: string;
    preview: PreviewEntry;
    deliveryMethod: DeliveryMethod;
    rightsFolders: Array<RightsFolder>;
    style: BeatStyle;
    approved: boolean;
    texture: BeatTexture;
    category: BeatCategory;
    artist: string;
    coverArt: Array<CoverArtEntry>;
}
export interface PerSectionRewardMode {
    forum: RewardMode;
    music: RewardMode;
    mixtape: RewardMode;
    live: RewardMode;
    games: RewardMode;
    bonus: RewardMode;
    showcase: RewardMode;
}
export interface ScheduledRelease {
    interval: ReleaseInterval;
    scheduleId: string;
    isPaused: boolean;
    createdAt: bigint;
    sourcePool?: string;
    nextRunTime: bigint;
    poolName: string;
    amountPerCycle: bigint;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface BeatFilter {
    style?: BeatStyle;
    texture?: BeatTexture;
    category?: BeatCategory;
}
export interface PlatformToggles {
    gamesMode: VisibilityMode;
    showPublicLedger: boolean;
    walletMode: VisibilityMode;
    showHeaderCoinBalance: boolean;
}
export interface SpendEntryPublic {
    useCase: SpendUseCase;
    beatId?: string;
    timestamp: bigint;
    amount: number;
}
export interface Showcase {
    id: string;
    externalLink?: string;
    songName: string;
    audioFile: ExternalBlob;
    style: BeatStyle;
    approved: boolean;
    beatId?: string;
    texture: BeatTexture;
    category: BeatCategory;
    artistName: string;
    coverArt?: ExternalBlob;
}
export interface MixtapeSubmissionFeeConfig {
    enabled: boolean;
    priceInCents: bigint;
}
export interface VerifiedListenerBadge {
    dateEarned: bigint;
    tier: PoLBadgeTier;
    isActive: boolean;
    confidenceScore: number;
}
export interface UserWalletPublic {
    lastLoginDate: bigint;
    balance: number;
    rewardEligible: boolean;
    lastStreakReset: bigint;
    loginStreak: bigint;
    earnHistory: Array<EarnEntryPublic>;
    spendHistory: Array<SpendEntryPublic>;
}
export interface PoLSessionRecord {
    startTime: bigint;
    contentId: string;
    contentType: string;
    endTime: bigint;
    playbackDurationMs: bigint;
    confidenceScore: number;
    tabActivityScore: number;
    earnedTokens: number;
    playbackContinuityScore: number;
    sessionId: string;
    badgeAwarded?: PoLBadgeTier;
}
export interface MIK97TokenSupply {
    initialCirculating: bigint;
    expansionReserve: TreasuryPool;
    totalBoughtBack: bigint;
    liquidityPool: TreasuryPool;
    promotionsPool: TreasuryPool;
    currentCirculating: bigint;
    totalBurned: bigint;
    reservePool: TreasuryPool;
    totalMaxSupply: bigint;
    teamPayoutReserve: bigint;
    platformTeamPool: TreasuryPool;
    rewardsPool: TreasuryPool;
    adminPersonalAllocation: bigint;
}
export interface LicenseDocEntry {
    assetId: string;
    reference: ExternalBlob;
    description?: string;
    docType: LicenseDocType;
}
export interface UnstakeResult {
    penaltyCharged: number;
    penaltyBurned: number;
    penaltyToRewards: number;
    principalReturned: number;
    rewardsPaid: number;
}
export interface Milestone {
    media?: ExternalBlob;
    title: string;
    order: bigint;
    date: string;
    description: string;
}
export interface EarnResult {
    capReached: boolean;
    dailyEarned: number;
    tokensEarned: number;
    newBalance: number;
    dailyCap: number;
}
export interface PoLResetConfig {
    resetTimeOfDayHours: bigint;
    resetIntervalDays: bigint;
    resetEnabled: boolean;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface DynamicRatioConfig {
    tokenPriceUsd: number;
    discountMode: DiscountMode;
    priceLastUpdated: bigint;
    isEnabled: boolean;
    rewardMode: RewardMode;
    perSectionRewardMode: PerSectionRewardMode;
    dollarValueConfig: DollarValueConfig;
}
export interface CoverArtEntry {
    assetId: string;
    reference: ExternalBlob;
    description?: string;
    fileType: CoverArtType;
}
export interface Message {
    id: string;
    principal: Principal;
    createdAt: bigint;
    authorName?: string;
    sectionId: string;
    message: string;
}
export interface AudioFileEntry {
    assetId: string;
    reference: ExternalBlob;
    description?: string;
    fileType: AudioFileType;
}
export interface Section {
    id: string;
    title: string;
    creator: string;
    createdAt: bigint;
    description: string;
    creatorName: string;
    linkSharingEnabled: boolean;
}
export interface ICRC1Token {
    fee: bigint;
    initialCirculating: bigint;
    decimals: number;
    logo: string;
    name: string;
    totalSupply: bigint;
    symbol: string;
}
export interface ReleaseAuditEntry {
    triggeredBy: string;
    timestamp: bigint;
    poolName: string;
    amount: bigint;
    reason: ReleaseReason;
}
export interface ShowcaseHighlight {
    mixtapeId: string;
    highlightedSong: ExternalBlob;
    artistName: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum AudioFileType {
    mp3 = "mp3",
    wav = "wav",
    stems = "stems"
}
export enum BeatCategory {
    pop = "pop",
    lofi = "lofi",
    rock = "rock",
    hipHop = "hipHop",
    electronic = "electronic"
}
export enum BeatStyle {
    experimental = "experimental",
    oldSchool = "oldSchool",
    trap = "trap",
    classic = "classic",
    modern = "modern",
    jazzInfluence = "jazzInfluence"
}
export enum BeatTexture {
    smooth = "smooth",
    gritty = "gritty",
    upbeat = "upbeat",
    melodic = "melodic"
}
export enum CoverArtType {
    jpg = "jpg",
    png = "png",
    webp = "webp"
}
export enum DeliveryMethod {
    googleDrive = "googleDrive",
    zipFiles = "zipFiles"
}
export enum DiscountMode {
    Dynamic = "Dynamic",
    Fixed = "Fixed"
}
export enum EarnCategory {
    music = "music",
    live = "live",
    games = "games",
    bonus = "bonus"
}
export enum LicenseDocType {
    pdf = "pdf",
    txt = "txt",
    docx = "docx",
    folder = "folder"
}
export enum PageType {
    mva = "mva",
    forum = "forum",
    live = "live",
    mixtapes = "mixtapes",
    store = "store",
    musicLinks = "musicLinks",
    showcase = "showcase"
}
export enum PoLBadgeTier {
    Gold = "Gold",
    Bronze = "Bronze",
    Silver = "Silver"
}
export enum PoSPRoomStatus {
    Active = "Active",
    Waiting = "Waiting",
    Cancelled = "Cancelled",
    Completed = "Completed",
    Expired = "Expired"
}
export enum PoSPRoomType {
    SonicHash = "SonicHash",
    PresenceTracking = "PresenceTracking"
}
export enum PreviewType {
    audio = "audio",
    video = "video"
}
export enum ReleaseInterval {
    monthly = "monthly",
    daily = "daily",
    weekly = "weekly"
}
export enum ReleaseReason {
    adminManual = "adminManual",
    scheduledRelease = "scheduledRelease",
    emergency = "emergency",
    rewardPoolLow = "rewardPoolLow"
}
export enum RightsType {
    basicRight = "basicRight",
    premiumRight = "premiumRight",
    exclusiveRight = "exclusiveRight",
    stems = "stems"
}
export enum SpendUseCase {
    mixtapeDrop = "mixtapeDrop",
    premiumContent = "premiumContent",
    showcaseEntry = "showcaseEntry",
    beatDiscount = "beatDiscount"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VisibilityMode {
    live = "live",
    hidden = "hidden",
    comingSoon = "comingSoon"
}
export interface backendInterface {
    addExcludedVisitor(principal: Principal): Promise<void>;
    addMessage(sectionId: string, id: string, message: string): Promise<void>;
    addMusicLink(title: string, platform: Platform, url: string, releaseDate: string | null, coverArt: ExternalBlob | null): Promise<void>;
    addReplay(id: string, title: string, description: string, replayUrl: string): Promise<void>;
    addUpcomingShow(id: string, title: string, date: string, time: string, description: string): Promise<void>;
    airdropFromPromotions(recipients: Array<[string, number]>): Promise<{
        __kind__: "ok";
        ok: Array<[string, string]>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    applyTokenDiscount(tokensRequestedFloat: number, priceInCents: bigint, useCase: string, beatId: string | null, rightsType: string): Promise<{
        __kind__: "ok";
        ok: {
            discountApplied: bigint;
            tokensActuallyBurned: number;
            remainingBalance: number;
        };
    } | {
        __kind__: "err";
        err: string;
    }>;
    approveAllShowcases(): Promise<void>;
    approveMixtape(id: string): Promise<void>;
    approveShowcase(id: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bulkUpdateMessages(messageUpdates: Array<MessageUpdate>): Promise<void>;
    burnTokens(amountFloat: number, useCase: string, beatId: string | null): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    canGetBasicRightsWithLicense(beatId: string): Promise<boolean>;
    canGetExclusiveRightsWithLicense(beatId: string): Promise<boolean>;
    canGetPremiumRightsWithLicense(beatId: string): Promise<boolean>;
    canGetStemsRightsWithLicense(beatId: string): Promise<boolean>;
    /**
     * / Admin-only: cancel a room.
     */
    cancelRoom(roomId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    checkAndAutoRelease(): Promise<{
        __kind__: "ok";
        ok: ReleaseAuditEntry | null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Public entry point to expire rooms (can also be called by frontend or cron).
     */
    checkAndExpireRooms(): Promise<void>;
    claimDailyLoginBonus(): Promise<{
        __kind__: "ok";
        ok: {
            streak: bigint;
            tokensEarned: number;
            streakBonusEarned: boolean;
        };
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Admin-only: claim the full adminPersonalAllocation (5M MIK97) to a destination wallet.
     * / Can only be called once. Sets adminPersonalAllocation to 0 after claim.
     */
    claimPersonalAllocation(destinationPrincipal: Principal): Promise<{
        __kind__: "ok";
        ok: {
            destination: Principal;
            amountClaimed: number;
        };
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Claim reward after a room is completed. Validates presence threshold.
     */
    claimRoomReward(roomId: string): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Claim accrued staking rewards without unstaking.
     */
    claimStakingRewards(stakeId: string): Promise<{
        __kind__: "ok";
        ok: number;
    } | {
        __kind__: "err";
        err: string;
    }>;
    clearFeaturedBeat(): Promise<void>;
    clearRedirectUrl(): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createOrGetWallet(): Promise<{
        __kind__: "ok";
        ok: UserWalletPublic;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Create a presence-tracking room (external links). Host fee deducted if enabled.
     */
    createPresenceRoom(title: string, contentUrl: string, durationMinutes: bigint, capacity: bigint): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createReleaseSchedule(scheduleId: string, poolName: string, amountPerCycleFloat: number, interval: ReleaseInterval, sourcePool: string): Promise<{
        __kind__: "ok";
        ok: ScheduledRelease;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Admin-only: create a scheduled room.
     */
    createScheduledRoom(title: string, contentUrl: string, contentType: PoSPRoomType, scheduledAt: bigint, durationMinutes: bigint, capacity: bigint): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createSection(id: string, title: string, description: string, linkSharingEnabled: boolean): Promise<void>;
    deleteBasicRightsLicense(): Promise<void>;
    deleteBeat(id: string): Promise<void>;
    deleteExclusiveRightsLicense(): Promise<void>;
    deleteMessage(id: string): Promise<void>;
    deleteMilestone(id: string): Promise<void>;
    deleteMixtape(id: string): Promise<void>;
    deleteMusicLink(title: string): Promise<void>;
    deleteMvaPreview(): Promise<void>;
    deletePremiumRightsLicense(): Promise<void>;
    deleteReleaseSchedule(scheduleId: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteReplay(id: string): Promise<void>;
    deleteSection(id: string): Promise<void>;
    deleteShowcase(id: string): Promise<void>;
    deleteStemsRightsLicense(): Promise<void>;
    deleteUpcomingShow(id: string): Promise<void>;
    earnTokens(category: string, points: bigint, gameType: string | null, description: string | null): Promise<{
        __kind__: "ok";
        ok: EarnResult;
    } | {
        __kind__: "err";
        err: string;
    }>;
    emergencyPauseAll(pause: boolean): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    endAllLiveStreams(): Promise<void>;
    endLiveStream(id: string): Promise<void>;
    endLiveWatchSession(): Promise<{
        __kind__: "ok";
        ok: {
            totalEarned: number;
        };
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Execute all due scheduled releases. Call this from a heartbeat or manually.
     * / Skips paused schedules and respects daily/weekly caps.
     * / autoReleasePaused only blocks the threshold-based auto-release (checkAndAutoRelease),
     * / NOT the interval-based scheduled releases created by createReleaseSchedule.
     */
    executeScheduledReleases(): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    expandPoolCeiling(poolName: string, newCeiling: number): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    filterBeats(filter: BeatFilter): Promise<Array<Beat>>;
    /**
     * / Returns current accrued (unclaimed) reward for a stake in MIK97.
     */
    getAccruedRewards(stakeId: string): Promise<number>;
    getActiveLiveStreams(): Promise<Array<LiveStream>>;
    /**
     * / Returns open (Active or Waiting) rooms visible to all users.
     */
    getActiveRooms(): Promise<Array<PoSPRoom>>;
    getAnalytics(): Promise<AnalyticsData>;
    getApprovedMixtapes(): Promise<Array<Mixtape>>;
    getApprovedShowcases(): Promise<Array<Showcase>>;
    getBasicRightsLicense(): Promise<ExternalBlob | null>;
    getBeat(id: string): Promise<Beat | null>;
    /**
     * / Returns per-rights-tier discount percentage caps. Public — needed at checkout.
     * / Applies safe defaults if any percentage fields are out of range.
     */
    getBeatTierDiscountConfig(): Promise<BeatTierDiscountConfig>;
    getBeats(): Promise<Array<Beat>>;
    /**
     * / Returns the current bonus earning config. Public — used by wallet/how-to-earn displays.
     * / Normalizes legacy stored value: showcaseUploadBonusTokens >= 5000 → corrected to 50.
     * / Ensures all toggle fields have safe defaults in case old stored data is missing them.
     */
    getBonusEarningConfig(): Promise<BonusEarningConfig>;
    getBurnStats(): Promise<{
        burnByUseCase: Array<[string, number]>;
        totalBurned: number;
        recentBurns: Array<BurnEventPublic>;
    }>;
    getBurnStatsAdmin(): Promise<{
        burnByUseCase: Array<[string, number]>;
        totalBurned: number;
        recentBurns: Array<BurnEventPublic>;
        burnLogSize: bigint;
    }>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDailyCapConfig(): Promise<DailyCapConfig>;
    getDailyCapStatus(): Promise<{
        __kind__: "ok";
        ok: DailyCapStatus;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getDailyLoginStatus(): Promise<{
        lastLoginDate: bigint;
        canClaimBonus: boolean;
        loginStreak: bigint;
    }>;
    getDecimalFactor(): Promise<bigint>;
    getDynamicRatioConfig(): Promise<DynamicRatioConfig>;
    getDynamicRewardPreview(): Promise<Array<{
        tokenPriceUsd: number;
        sectionName: string;
        currentMode: string;
        tokenPayout: number;
        usdValue: number;
    }>>;
    getEmissionStats(): Promise<{
        activeScheduleCount: bigint;
        scheduledReleaseCount: bigint;
        rewardPoolPercent: bigint;
        maxDailyRelease: bigint;
        autoReleasePaused: boolean;
        isPaused: boolean;
        dailyReleasedToday: bigint;
        maxWeeklyRelease: bigint;
        weeklyReleasedThisWeek: bigint;
    }>;
    getExcludedVisitors(): Promise<Array<Principal>>;
    getExclusiveRightsLicense(): Promise<ExternalBlob | null>;
    getFeaturedBeat(): Promise<Beat | null>;
    getForumRewardConfig(): Promise<ForumRewardConfig>;
    getForumRewardsPublicInfo(): Promise<{
        tokensPerMessage: number;
        isEnabled: boolean;
        rewardEveryNMessages: bigint;
    }>;
    getFundingMilestone(): Promise<{
        reached: boolean;
        goal: number;
        isVisible: boolean;
        current: number;
        percentage: number;
    }>;
    getGameLeaderboard(gameType: string): Promise<Array<GameScore>>;
    getGoogleDriveLink(beatId: string, rightsType: RightsType, sessionId: string | null): Promise<string | null>;
    getICRC1Balance(principal: Principal): Promise<bigint>;
    getICRC1Owner(): Promise<Principal | null>;
    getICRC1TokenInfo(): Promise<ICRC1Token>;
    getICRC1TotalMinted(): Promise<bigint>;
    getLicenseFiles(beatId: string, rightsType: RightsType, sessionId: string | null): Promise<Array<ExternalBlob>>;
    getLiquidityDeploymentLog(): Promise<Array<LiquidityDeploymentEntry>>;
    getLiquidityPoolStatus(): Promise<{
        balance: number;
        ceiling: number;
        deploymentStatus: string;
        percentRemaining: number;
        deploymentNote: string;
        isLocked: boolean;
    }>;
    getLiveWatchStatus(): Promise<{
        __kind__: "ok";
        ok: {
            isInSession: boolean;
            tokensEarnedToday: number;
            canStartNew: boolean;
            dailyCap: number;
            cooldownEndsAt?: bigint;
            minutesWatched: bigint;
        };
    } | {
        __kind__: "err";
        err: string;
    }>;
    getManySections(ids: Array<string>): Promise<Array<Section>>;
    getMessages(sectionId: string): Promise<Array<Message>>;
    getMigrationLog(): Promise<Array<MigrationLogEntry>>;
    getMilestones(): Promise<Array<Milestone>>;
    getMixtapeRewardConfig(): Promise<MixtapeRewardConfig>;
    getMixtapeSubmissionFeeConfig(): Promise<MixtapeSubmissionFeeConfig>;
    /**
     * / Returns the Float token reward for a mixtape upload with the given song count.
     * / Public — used by the frontend to show the reward before upload.
     */
    getMixtapeUploadReward(songCount: bigint): Promise<number>;
    getMusicLinks(): Promise<Array<MusicLink>>;
    getMusicRewardStatus(contentId: string, contentType: string): Promise<{
        alreadyEarned: boolean;
        dailyCapRemaining: number;
        cooldownDaysLeft: bigint;
    }>;
    getMvaPreview(): Promise<ExternalBlob | null>;
    getMyDailyEarnings(): Promise<{
        __kind__: "ok";
        ok: {
            globalCapHit: boolean;
            breakdown: {
                musicCap: number;
                jumperEarned: number;
                flappyEarned: number;
                liveEarned: number;
                forumEarned: number;
                mixtapeEarned: number;
                showcaseEarned: number;
                jumperCap: number;
                gamesEarned: number;
                flappyCap: number;
                liveCap: number;
                musicEarned: number;
                gamesCap: number;
                bonusEarned: number;
            };
            globalCap: number;
            totalEarnedToday: number;
            resetInSeconds: bigint;
            globalCapRemaining: number;
        };
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Returns per-category daily earning breakdown for the caller.
     * / All 8 reward categories tracked individually with caps.
     */
    getMyDailyEarningsByCategory(): Promise<{
        __kind__: "ok";
        ok: DailyEarningsByCategory;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Returns the caller's Verified Listener Badges (all tiers).
     */
    getMyPoLBadges(): Promise<Array<VerifiedListenerBadge>>;
    /**
     * / Returns the caller's recent PoL sessions, most recent first, up to `limit`.
     */
    getMyPoLSessions(limit: bigint): Promise<Array<PoLSessionRecord>>;
    /**
     * / Returns the caller's PoSP participant sessions.
     */
    getMyRoomSessions(): Promise<Array<PoSPParticipantSession>>;
    /**
     * / Returns caller's stakes (active and closed).
     */
    getMyStakes(): Promise<Array<StakeRecord>>;
    /**
     * / Returns the Int timestamp (nanoseconds) of when the next PoL tier reset will fire.
     * / Returns 0 if reset is disabled.
     */
    getNextPoLResetTime(): Promise<bigint>;
    /**
     * / Admin query: returns the most recent 'limit' payout audit entries (max 500).
     */
    getPayoutAuditLog(limit: bigint): Promise<Array<{
        id: string;
        recipient: string;
        actionType: string;
        poolDrawnFrom: string;
        timestamp: bigint;
        category: string;
        amount: number;
    }>>;
    getPendingMixtapes(): Promise<Array<Mixtape>>;
    getPendingShowcases(): Promise<Array<Showcase>>;
    /**
     * / Query: returns personal allocation status for the admin.
     */
    getPersonalAllocationStatus(): Promise<{
        destination?: Principal;
        allocated: number;
        claimed: boolean;
        claimedAt?: bigint;
    }>;
    getPlatformToggles(): Promise<PlatformToggles>;
    /**
     * / Returns current PoL configuration (readable by anyone).
     */
    getPoLConfig(): Promise<PoLConfig>;
    /**
     * / Returns current PoL reset configuration (readable by anyone).
     */
    getPoLResetConfig(): Promise<PoLResetConfig>;
    /**
     * / Returns current PoSP configuration (readable by anyone).
     */
    getPoSPConfig(): Promise<PoSPConfig>;
    /**
     * / Admin query: get a single room with full detail.
     */
    getPoSPRoomDetails(roomId: string): Promise<{
        __kind__: "ok";
        ok: PoSPRoom;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Admin query: list rooms, optionally filtered by status.
     */
    getPoSPRooms(status: PoSPRoomStatus | null): Promise<Array<PoSPRoom>>;
    /**
     * / Returns aggregate Layer 2 statistics.
     */
    getPoSPStats(): Promise<{
        totalRewardsPaid: bigint;
        totalVerifiedSessions: bigint;
        activeRooms: bigint;
        totalRooms: bigint;
    }>;
    /**
     * / Admin query: returns the most recent pool activity entries (legacy compatibility).
     */
    getPoolActivityLog(limit: bigint | null): Promise<Array<PoolActivityEntry>>;
    /**
     * / Returns detailed stats for all treasury pools as Float values for the admin treasury panel.
     */
    getPoolDetails(): Promise<{
        circulatingSupply: number;
        totalBoughtBack: number;
        totalBurned: number;
        teamPayoutReserve: number;
        pools: Array<{
            totalAllocated: number;
            currentBalance: number;
            name: string;
            locked: number;
            released: number;
            isExpansionReserve: boolean;
            poolKey: string;
            burned: number;
        }>;
        maxSupply: number;
        stakingVaultTotal: number;
        adminPersonalAllocation: number;
    }>;
    getPremiumRightsLicense(): Promise<ExternalBlob | null>;
    /**
     * / Public query: returns paginated transaction ledger for the public explorer page.
     * / Accessible by anyone (not just admins).
     */
    getPublicTransactionLedger(limit: bigint | null, offset: bigint | null): Promise<Array<PoolActivityEntry>>;
    /**
     * / Public query: total count of transaction ledger entries (for pagination).
     */
    getPublicTransactionLedgerCount(): Promise<bigint>;
    getPurchaseHistory(): Promise<Array<string>>;
    getRedirectUrl(): Promise<string | null>;
    getReleaseAuditLog(): Promise<Array<ReleaseAuditEntry>>;
    /**
     * / Returns release audit log entries in the extended view format with Float amounts,
     * / human-readable reason strings, and success/errorMsg fields (always true/null for
     * / legacy entries which are all successful by definition).
     */
    getReleaseAuditLogV2(): Promise<Array<ReleaseAuditEntryView>>;
    getReleaseEngineConfig(): Promise<ReleaseEngineConfig>;
    getReplays(): Promise<Array<Replay>>;
    getRewardRateConfig(): Promise<RewardRateConfig>;
    getRewardSectionToggles(): Promise<RewardSectionToggles>;
    getRightsZipFile(beatId: string, rightsType: RightsType, sessionId: string | null): Promise<ExternalBlob | null>;
    /**
     * / Returns all participant sessions for a room (anyone can query).
     */
    getRoomParticipants(roomId: string): Promise<Array<PoSPParticipantSession>>;
    getSection(id: string): Promise<Section | null>;
    getSectionLinkSharing(id: string): Promise<boolean>;
    getSections(): Promise<Array<Section>>;
    getShowcaseHighlights(): Promise<Array<ShowcaseHighlight>>;
    /**
     * / Returns current staking configuration (public query).
     */
    getStakingConfig(): Promise<StakingConfig>;
    getStemsRightsLicense(): Promise<ExternalBlob | null>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    /**
     * / Admin query: returns all team payout log entries (newest first), amounts as Float.
     */
    getTeamPayoutLog(): Promise<Array<{
        id: string;
        recipient: string;
        description: string;
        authorizedBy: string;
        timestamp: bigint;
        amount: number;
    }>>;
    getTokenSupply(): Promise<MIK97TokenSupply | null>;
    /**
     * / Admin query: full transaction ledger with filtering and pagination.
     * / actionCategory: substring match on txType ("user_action", "admin_action", "system_action")
     * /   or on action string (e.g. "burn", "stake", "earn") — matched against both fields.
     * / initiatorFilter: substring match on initiator (principal text or "system").
     * / poolFilter: exact match on pool name.
     * / startTime / endTime: inclusive timestamp bounds (nanoseconds, Time.now() scale).
     * / limit / offset: pagination.
     */
    getTransactionLedger(actionCategory: string | null, initiatorFilter: string | null, poolFilter: string | null, startTime: bigint | null, endTime: bigint | null, limit: bigint, offset: bigint): Promise<Array<PoolActivityEntry>>;
    /**
     * / Admin query: count of entries matching the given filters (for pagination UI).
     */
    getTransactionLedgerCount(actionCategory: string | null, initiatorFilter: string | null, poolFilter: string | null, startTime: bigint | null, endTime: bigint | null): Promise<bigint>;
    getUpcomingShows(): Promise<Array<Show>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserWallet(): Promise<UserWalletPublic | null>;
    getWalletCount(): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    heartbeatLiveWatch(): Promise<{
        __kind__: "ok";
        ok: {
            tokensEarned: number;
            minutesWatched: bigint;
            nextMilestone?: bigint;
        };
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Called when native content plays to potentially trigger an auto-room.
     */
    incrementContentPlayCount(contentId: string): Promise<void>;
    initializeTokenSupply(): Promise<{
        __kind__: "ok";
        ok: MIK97TokenSupply;
    } | {
        __kind__: "err";
        err: string;
    }>;
    initiateDeployment(amount: number, destinationNote: string): Promise<{
        __kind__: "ok";
        ok: {
            deployed: number;
            newLpBalance: number;
            logEntryId: string;
        };
    } | {
        __kind__: "err";
        err: string;
    }>;
    initiateMigration(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    isExcludedVisitor(principal: Principal): Promise<boolean>;
    isICRC1OwnershipRenounced(): Promise<boolean>;
    isMigrationCompleted(): Promise<boolean>;
    isMigrationPaused(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    /**
     * / Join an active or waiting room.
     */
    joinRoom(roomId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Leave a room.
     */
    leaveRoom(roomId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    listReleaseSchedules(): Promise<Array<ScheduledRelease>>;
    lockLiquidityPool(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    markMilestoneReached(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    pauseReleaseSchedule(scheduleId: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    processOutcall(input: TransformationInput): Promise<TransformationOutput>;
    recordBeatPurchase(beatId: string, sessionId: string, isFree: boolean, rightsType: RightsType): Promise<void>;
    recordMusicReward(contentType: string, contentId: string, rewardType: string, sessionId: string, confidenceScore: number): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    } | {
        __kind__: "belowThreshold";
        belowThreshold: null;
    } | {
        __kind__: "cooldown";
        cooldown: bigint;
    }>;
    /**
     * / Record a presence heartbeat (called every ~30s by frontend while user is active).
     */
    recordPresenceHeartbeat(roomId: string, interactionCheckPassed: boolean): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    recordSiteVisit(page: PageType): Promise<void>;
    rejectMixtape(id: string): Promise<void>;
    /**
     * / Release tokens from the fully-locked expansion reserve into a target active pool.
     * / This does NOT increase circulating supply — tokens move from expansion reserve to
     * / the chosen pool, where they remain locked until users earn them through the emission system.
     * / IMPORTANT: This function ONLY reads from expansionReserve.locked.
     * / It NEVER touches reservePool under any circumstances.
     */
    releaseFromExpansionReserve(amount: number, targetPool: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    removeExcludedVisitor(principal: Principal): Promise<void>;
    renounceICRC1Ownership(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    requestApproval(): Promise<void>;
    resumeReleaseSchedule(scheduleId: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Run a specific schedule immediately (admin "Run Now" action).
     * / Executes the release right away regardless of nextRunTime, then advances nextRunTime.
     * / Returns a plain text success/error message — never an object.
     */
    runScheduleNow(scheduleId: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveMilestone(id: string, milestone: Milestone): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setFeaturedBeat(beatId: string): Promise<void>;
    setFundingGoal(newGoal: number): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Admin: show or hide the funding milestone banner on public pages.
     */
    setFundingMilestoneVisible(visible: boolean): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Legacy compatibility shims — delegate to the new mode-based setters.
     * / setGamesComingSoon(true) → #comingSoon; setGamesComingSoon(false) → #live.
     */
    setGamesComingSoon(enabled: boolean): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Admin: set Games section visibility mode (#live | #comingSoon | #hidden).
     */
    setGamesMode(mode: VisibilityMode): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setLiquidityDeploymentStatus(status: string, note: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setMixtapeSubmissionFeeConfig(enabled: boolean, priceInCents: bigint): Promise<void>;
    /**
     * / Admin: set the penalty routing split for early unstakes.
     * / burnPct + rewardsPct + promoPct + reservePct MUST sum to 100.
     */
    setPenaltyRouting(burnPct: number, rewardsPct: number, promoPct: number, reservePct: number): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Admin-only: update PoL configuration.
     */
    setPoLConfig(config: PoLConfig): Promise<void>;
    /**
     * / Admin-only: update PoL tier reset schedule.
     */
    setPoLResetConfig(config: PoLResetConfig): Promise<void>;
    /**
     * / Admin-only: update Layer 2 PoSP configuration.
     */
    setPoSPConfig(config: PoSPConfig): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setRedirectUrl(url: string): Promise<void>;
    setSectionLinkSharing(id: string, enabled: boolean): Promise<void>;
    /**
     * / Admin: show or hide the MIK97 coin balance indicator in the page header for non-admins.
     */
    setShowHeaderCoinBalance(show: boolean): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Admin: show or hide the public transaction ledger page for non-admins.
     */
    setShowPublicLedger(show: boolean): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setShowcaseHighlight(mixtapeId: string, song: ExternalBlob, artistName: string): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    setWalletComingSoon(enabled: boolean): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Admin: set Wallet section visibility mode (#live | #comingSoon | #hidden).
     */
    setWalletMode(mode: VisibilityMode): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Stake tokens from caller's wallet for a given lock period.
     * / lockDays must be 30, 90, or 180.
     */
    stakeTokens(amountFloat: number, lockDays: bigint): Promise<{
        __kind__: "ok";
        ok: StakeResult;
    } | {
        __kind__: "err";
        err: string;
    }>;
    startLiveStream(id: string, host: string, title: string, description: string): Promise<void>;
    startLiveWatchSession(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    submitGameScore(gameType: string, score: bigint): Promise<{
        __kind__: "ok";
        ok: EarnResult;
    } | {
        __kind__: "err";
        err: string;
    }>;
    submitMixtape(id: string, title: string, artistName: string, description: string, coverArt: ExternalBlob | null, songs: Array<ExternalBlob>, externalLinks: Array<string>, stripeSessionId: string | null): Promise<void>;
    submitShowcase(id: string, songName: string, artistName: string, category: BeatCategory, style: BeatStyle, texture: BeatTexture, beatId: string | null, audioFile: ExternalBlob, coverArt: ExternalBlob | null, externalLink: string | null): Promise<void>;
    /**
     * / Admin-only: transfer tokens from the Reserve pool into Rewards or Promotions pool.
     * / The reserve pool acts as a backup tank; tokens move between pools (not to circulation).
     * / IMPORTANT: This function ONLY reads from and deducts reservePool.locked.
     * / It NEVER touches expansionReserve under any circumstances.
     * / To release from expansion reserve, use releaseFromExpansionReserve() instead.
     */
    transferFromReservePool(targetPool: string, amount: number): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    transferICRC1Tokens(to: Principal, amount: bigint): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Admin-only: transfer tokens from the 5M team payout reserve to a recipient's wallet.
     * / Amount is in MIK97 Float (e.g. 100.5). Recipient's internal wallet is credited.
     */
    transferTokensTeamPayout(recipientPrincipal: Principal, amount: number, description: string): Promise<{
        __kind__: "ok";
        ok: {
            amountPaid: number;
            newTeamPayoutReserve: number;
        };
    } | {
        __kind__: "err";
        err: string;
    }>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    triggerManualRelease(poolName: string, amountFloat: number): Promise<{
        __kind__: "ok";
        ok: ReleaseAuditEntry;
    } | {
        __kind__: "err";
        err: string;
    }>;
    unlockLiquidityPool(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    unmarkRightsAsSold(beatId: string, rightsType: RightsType): Promise<void>;
    /**
     * / Unstake: return principal plus prorated unclaimed rewards.
     * / If unstaking before lock period ends and earlyUnstakePenaltyEnabled is true,
     * / a sliding-scale penalty is charged on the principal. The penalty is split
     * / into up to 4 routing destinations (burn, rewards, promotions, reserve)
     * / as configured by the admin via setPenaltyRouting().
     * / Returns a full UnstakeResult breakdown.
     */
    unstake(stakeId: string): Promise<{
        __kind__: "ok";
        ok: UnstakeResult;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateBasicRightsLicense(license: ExternalBlob): Promise<void>;
    updateBeat(id: string, title: string, artist: string, category: BeatCategory, style: BeatStyle, texture: BeatTexture, coverArt: Array<CoverArtEntry>, preview: PreviewEntry, rightsFolders: Array<RightsFolder>, deliveryMethod: DeliveryMethod): Promise<void>;
    /**
     * / Updates per-rights-tier discount configuration. Admin only.
     */
    updateBeatTierDiscountConfig(config: BeatTierDiscountConfig): Promise<{
        __kind__: "ok";
        ok: BeatTierDiscountConfig;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateBonusEarningConfig(config: BonusEarningConfig): Promise<{
        __kind__: "ok";
        ok: BonusEarningConfig;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateDailyCapConfig(config: DailyCapConfig): Promise<{
        __kind__: "ok";
        ok: DailyCapConfig;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateDynamicRatioConfig(config: DynamicRatioConfig): Promise<{
        __kind__: "ok";
        ok: DynamicRatioConfig;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateExclusiveRightsLicense(license: ExternalBlob): Promise<void>;
    updateForumRewardConfig(config: ForumRewardConfig): Promise<{
        __kind__: "ok";
        ok: ForumRewardConfig;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateFundingAmount(newAmount: number): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateMilestoneOrder(milestoneIds: Array<[string, bigint]>): Promise<void>;
    updateMixtapeRewardConfig(config: MixtapeRewardConfig): Promise<{
        __kind__: "ok";
        ok: MixtapeRewardConfig;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Dedicated setter for mixtape upload reward enabled flag (separate from tier config).
     */
    updateMixtapeUploadRewardEnabled(enabled: boolean): Promise<{
        __kind__: "ok";
        ok: BonusEarningConfig;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateMusicLink(title: string, platform: Platform, url: string, releaseDate: string | null, coverArt: ExternalBlob | null): Promise<void>;
    updatePremiumRightsLicense(license: ExternalBlob): Promise<void>;
    updateReleaseEngineConfig(config: ReleaseEngineConfig): Promise<{
        __kind__: "ok";
        ok: ReleaseEngineConfig;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateReplay(id: string, title: string, description: string, replayUrl: string): Promise<void>;
    updateRewardRateConfig(config: RewardRateConfig): Promise<{
        __kind__: "ok";
        ok: RewardRateConfig;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateRewardSectionToggles(config: RewardSectionToggles): Promise<{
        __kind__: "ok";
        ok: RewardSectionToggles;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Dedicated setter for showcase upload reward to avoid frontend type mismatch errors.
     * / Accepts tokens (Float MIK97) and enabled flag separately.
     */
    updateShowcaseUploadReward(tokens: number, enabled: boolean): Promise<{
        __kind__: "ok";
        ok: BonusEarningConfig;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Admin: update staking configuration.
     */
    updateStakingConfig(config: StakingConfig): Promise<void>;
    updateStemsRightsLicense(license: ExternalBlob): Promise<void>;
    updateUpcomingShow(id: string, title: string, date: string, time: string, description: string): Promise<void>;
    uploadBasicRightsLicense(license: ExternalBlob): Promise<void>;
    uploadBeat(id: string, title: string, artist: string, category: BeatCategory, style: BeatStyle, texture: BeatTexture, coverArt: Array<CoverArtEntry>, preview: PreviewEntry, rightsFolders: Array<RightsFolder>, deliveryMethod: DeliveryMethod): Promise<void>;
    uploadExclusiveRightsLicense(license: ExternalBlob): Promise<void>;
    uploadMvaPreview(reference: ExternalBlob): Promise<void>;
    uploadPremiumRightsLicense(license: ExternalBlob): Promise<void>;
    uploadStemsRightsLicense(license: ExternalBlob): Promise<void>;
    verifyBeatPurchase(beatId: string, sessionId: string | null): Promise<boolean>;
    verifyGuestBeatPurchase(sessionId: string, beatId: string): Promise<boolean>;
}
