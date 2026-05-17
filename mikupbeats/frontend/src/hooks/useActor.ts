/**
 * useActor — replaces @caffeineai/core-infrastructure's ICP actor.
 * Returns an `actor` object with all the same method names,
 * now backed by REST API calls instead of ICP canister calls.
 */
import { useAuthStore } from "./useInternetIdentity";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function getToken() {
  return localStorage.getItem("mikupbeats_token");
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

async function uploadToB2(file: File, folder: string, onProgress?: (p: number) => void): Promise<string> {
  const { uploadUrl, publicUrl } = await apiFetch<{ uploadUrl: string; publicUrl: string }>(
    "/uploads/presign",
    { method: "POST", body: JSON.stringify({ fileType: file.type, folder }) }
  );
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
    xhr.onerror = () => reject(new Error("Upload network error"));
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
  return publicUrl;
}

/**
 * ExternalBlob replacement — same API surface as Caffeine's ExternalBlob
 * so existing components work without changes.
 */
class ExternalBlob {
  private _url: string | null = null;
  private _bytes: Uint8Array | null = null;
  private _progressCb?: (p: number) => void;

  static fromURL(url: string): ExternalBlob {
    const b = new ExternalBlob();
    b._url = url;
    return b;
  }

  static fromBytes(bytes: Uint8Array): ExternalBlob {
    const b = new ExternalBlob();
    b._bytes = bytes;
    return b;
  }

  withUploadProgress(cb: (p: number) => void): ExternalBlob {
    const b = new ExternalBlob();
    b._url = this._url;
    b._bytes = this._bytes;
    b._progressCb = cb;
    return b;
  }

  getDirectURL(): string {
    return this._url || "";
  }

  async getBytes(): Promise<Uint8Array> {
    if (this._bytes) return this._bytes;
    const res = await fetch(this._url!);
    return new Uint8Array(await res.arrayBuffer());
  }

  // Internal: upload a File to B2 and return URL as ExternalBlob
  static async fromFile(file: File, folder: string, onProgress?: (p: number) => void): Promise<ExternalBlob> {
    const url = await uploadToB2(file, folder, onProgress);
    return ExternalBlob.fromURL(url);
  }
}

// The actor object — all the same method names as the ICP actor
function createRestActor() {
  return {
    // ── Admin ──────────────────────────────────────────────────────────
    isCallerAdmin: async (): Promise<boolean> => {
      const user = useAuthStore.getState().identity;
      return user?.is_admin ?? false;
    },

    // ── Beats ──────────────────────────────────────────────────────────
    getBeats: () => apiFetch<any[]>("/beats"),
    getBeat: (id: string) => apiFetch<any>(`/beats/${id}`),
    getFeaturedBeat: () => apiFetch<any>("/beats/featured"),
    filterBeats: (filter: any) =>
      apiFetch<any[]>("/beats/filter", { method: "POST", body: JSON.stringify(filter) }),
    uploadBeat: (id: string, title: string, artist: string, category: any, style: any, texture: any,
      coverArt: any[], preview: any, rightsFolders: any[], deliveryMethod: any) =>
      apiFetch("/beats", { method: "POST", body: JSON.stringify({ id, title, artist, category, style, texture, coverArt, preview, rightsFolders, deliveryMethod }) }),
    updateBeat: (id: string, title: string, artist: string, category: any, style: any, texture: any,
      coverArt: any[], preview: any, rightsFolders: any[], deliveryMethod: any) =>
      apiFetch(`/beats/${id}`, { method: "PUT", body: JSON.stringify({ title, artist, category, style, texture, coverArt, preview, rightsFolders, deliveryMethod }) }),
    deleteBeat: (id: string) => apiFetch(`/beats/${id}`, { method: "DELETE" }),
    setFeaturedBeat: (id: string) => apiFetch(`/beats/${id}/featured`, { method: "POST" }),
    clearFeaturedBeat: () => apiFetch("/beats/featured/clear", { method: "DELETE" }),
    unmarkRightsAsSold: (beatId: string, rightsType: any) =>
      apiFetch(`/beats/${beatId}/unmark-rights`, { method: "POST", body: JSON.stringify({ rightsType }) }),

    // ── Showcases ──────────────────────────────────────────────────────
    getApprovedShowcases: () => apiFetch<any[]>("/showcases/approved"),
    getPendingShowcases: () => apiFetch<any[]>("/showcases/pending"),
    getShowcaseHighlights: () => apiFetch<any[]>("/showcases/highlights"),
    submitShowcase: (id: string, songName: string, artistName: string, category: any, style: any,
      texture: any, beatId: string | null, audioFile: any, coverArt: any, externalLink: string | null) =>
      apiFetch("/showcases", { method: "POST", body: JSON.stringify({ id, songName, artistName, category, style, texture, beatId, audioUrl: audioFile?.getDirectURL?.(), coverArtUrl: coverArt?.getDirectURL?.(), externalLink }) }),
    approveShowcase: (id: string) => apiFetch(`/showcases/${id}/approve`, { method: "POST" }),
    deleteShowcase: (id: string) => apiFetch(`/showcases/${id}`, { method: "DELETE" }),
    pinShowcaseHighlight: (id: string, showcaseId: string) =>
      apiFetch(`/showcases/highlights`, { method: "POST", body: JSON.stringify({ id, showcaseId }) }),
    unpinShowcaseHighlight: (id: string) => apiFetch(`/showcases/highlights/${id}`, { method: "DELETE" }),

    // ── Mixtapes ───────────────────────────────────────────────────────
    getMixtapes: () => apiFetch<any[]>("/mixtapes"),
    getPendingMixtapes: () => apiFetch<any[]>("/mixtapes/pending"),
    submitMixtape: (id: string, title: string, artistName: string, description: string, coverArt: any, songs: any[], externalLinks: string[]) =>
      apiFetch("/mixtapes", { method: "POST", body: JSON.stringify({ id, title, artistName, description, coverArtUrl: coverArt?.getDirectURL?.(), songUrls: songs.map((s: any) => s?.getDirectURL?.() || s), externalLinks }) }),
    approveMixtape: (id: string) => apiFetch(`/mixtapes/${id}/approve`, { method: "POST" }),
    deleteMixtape: (id: string) => apiFetch(`/mixtapes/${id}`, { method: "DELETE" }),
    getMixtapeSubmissionFeeConfig: () => apiFetch("/admin/mixtape-fee"),
    updateMixtapeSubmissionFeeConfig: (config: any) => apiFetch("/admin/mixtape-fee", { method: "PATCH", body: JSON.stringify(config) }),

    // ── Shows ──────────────────────────────────────────────────────────
    getUpcomingShows: () => apiFetch<any[]>("/shows"),
    addUpcomingShow: (id: string, title: string, date: string, time: string, description: string) =>
      apiFetch("/shows", { method: "POST", body: JSON.stringify({ id, title, date, time, description }) }),
    updateUpcomingShow: (id: string, title: string, date: string, time: string, description: string) =>
      apiFetch(`/shows/${id}`, { method: "PUT", body: JSON.stringify({ title, date, time, description }) }),
    deleteUpcomingShow: (id: string) => apiFetch(`/shows/${id}`, { method: "DELETE" }),

    // ── Milestones ─────────────────────────────────────────────────────
    getMilestones: () => apiFetch<any[]>("/milestones"),
    saveMilestone: (id: string, milestone: any) =>
      apiFetch(`/milestones/${id}`, { method: "PUT", body: JSON.stringify(milestone) }),
    deleteMilestone: (id: string) => apiFetch(`/milestones/${id}`, { method: "DELETE" }),
    getFundingMilestone: () => apiFetch("/admin/funding-milestone"),
    updateFundingMilestone: (data: any) => apiFetch("/admin/funding-milestone", { method: "PATCH", body: JSON.stringify(data) }),

    // ── Forum ──────────────────────────────────────────────────────────
    getSections: () => apiFetch<any[]>("/forum/sections"),
    createSection: (id: string, title: string, description: string) =>
      apiFetch("/forum/sections", { method: "POST", body: JSON.stringify({ id, title, description }) }),
    deleteSection: (id: string) => apiFetch(`/forum/sections/${id}`, { method: "DELETE" }),
    getThreads: (sectionId: string) => apiFetch<any[]>(`/forum/sections/${sectionId}/threads`),
    createThread: (id: string, sectionId: string, title: string) =>
      apiFetch("/forum/threads", { method: "POST", body: JSON.stringify({ id, sectionId, title }) }),
    getMessages: (threadId: string) => apiFetch<any[]>(`/forum/threads/${threadId}/messages`),
    postMessage: (id: string, threadId: string, content: string) =>
      apiFetch("/forum/messages", { method: "POST", body: JSON.stringify({ id, threadId, content }) }),
    editMessage: (id: string, content: string) =>
      apiFetch(`/forum/messages/${id}`, { method: "PATCH", body: JSON.stringify({ content }) }),
    deleteMessage: (id: string) => apiFetch(`/forum/messages/${id}`, { method: "DELETE" }),

    // ── Profile ────────────────────────────────────────────────────────
    getCallerUserProfile: () => apiFetch("/profile"),
    getUserProfile: (userId: string) => apiFetch(`/profile/${userId}`),
    saveCallerUserProfile: (profile: any) =>
      apiFetch("/profile", { method: "PATCH", body: JSON.stringify(profile) }),

    // ── Platform Toggles ───────────────────────────────────────────────
    getPlatformToggles: () => apiFetch("/admin/toggles"),
    updatePlatformGamesMode: (mode: string) =>
      apiFetch("/admin/toggles", { method: "PATCH", body: JSON.stringify({ games_mode: mode }) }),
    updatePlatformWalletMode: (mode: string) =>
      apiFetch("/admin/toggles", { method: "PATCH", body: JSON.stringify({ wallet_mode: mode }) }),
    updateShowHeaderCoinBalance: (show: boolean) =>
      apiFetch("/admin/toggles", { method: "PATCH", body: JSON.stringify({ show_header_coin_balance: show }) }),
    updateShowPublicLedger: (show: boolean) =>
      apiFetch("/admin/toggles", { method: "PATCH", body: JSON.stringify({ show_public_ledger: show }) }),

    // ── Stripe ─────────────────────────────────────────────────────────
    getStripeConfiguration: () => apiFetch("/admin/stripe-config"),
    updateStripeConfiguration: (config: any) =>
      apiFetch("/admin/stripe-config", { method: "PATCH", body: JSON.stringify(config) }),
    initiateStripeCheckout: (beatId: string, rightsType: string) =>
      apiFetch<{ url: string }>("/stripe/create-session", { method: "POST", body: JSON.stringify({ beatId, rightsType }) }),
    getStripeSessionStatus: (sessionId: string) =>
      apiFetch(`/stripe/session/${sessionId}`),

    // ── Analytics ──────────────────────────────────────────────────────
    getAnalyticsData: () => apiFetch("/admin/analytics"),
    recordSiteVisit: (page: string) =>
      apiFetch("/analytics/visit", { method: "POST", body: JSON.stringify({ page }) }),

    // ── YouTube / MVA ──────────────────────────────────────────────────
    getYouTubeConfig: () => apiFetch("/admin/youtube-config"),
    updateYouTubeConfig: (config: any) =>
      apiFetch("/admin/youtube-config", { method: "PATCH", body: JSON.stringify(config) }),
    getMvaPreviewEntries: () => apiFetch("/mva"),
    addMvaPreviewEntry: (id: string, entry: any) =>
      apiFetch("/mva", { method: "POST", body: JSON.stringify({ id, ...entry }) }),
    deleteMvaPreviewEntry: (id: string) => apiFetch(`/mva/${id}`, { method: "DELETE" }),
    getMusicLinks: () => apiFetch("/music-links"),
    addMusicLink: (id: string, link: any) =>
      apiFetch("/music-links", { method: "POST", body: JSON.stringify({ id, ...link }) }),
    deleteMusicLink: (id: string) => apiFetch(`/music-links/${id}`, { method: "DELETE" }),

    // ── License management ─────────────────────────────────────────────
    getLicenseTemplate: (type: string) => apiFetch(`/admin/licenses/${type}`),
    updateLicenseTemplate: (type: string, content: string) =>
      apiFetch(`/admin/licenses/${type}`, { method: "PUT", body: JSON.stringify({ content }) }),

    // ── Token settings (Phase 2, disabled by default) ──────────────────
    getTokenSettings: () => apiFetch("/admin/token-settings"),
    updateTokenSettings: (data: any) =>
      apiFetch("/admin/token-settings", { method: "PATCH", body: JSON.stringify(data) }),

    // ── Users (admin) ──────────────────────────────────────────────────
    getAllUsers: () => apiFetch("/admin/users"),
    updateUser: (id: string, data: any) =>
      apiFetch(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

    // ── Stub: ICP-specific things that become no-ops ───────────────────
    // These existed on the ICP actor but have no equivalent — return safe defaults
    getMIK97TokenSupply: async () => null,
    getCallerWallet: async () => null,
    getRewardSectionToggles: async () => ({
      forum: false, showcase: false, mixtape: false, store: false, games: false, listen: false,
    }),
    updateRewardSectionToggles: async () => null,
    getEmissionStats: async () => null,
    getPoolDetails: async () => [],
    burnTokens: async () => null,
    stakeTokens: async () => null,
    claimStakeRewards: async () => null,
    unstakeTokens: async () => null,
    getStakeRecords: async () => [],
    getPoLConfig: async () => null,
    getPoSPRooms: async () => [],
    createPoSPRoom: async () => null,
    joinPoSPRoom: async () => null,
    leavePoSPRoom: async () => null,
    getGameScores: async () => [],
    submitGameScore: async () => null,
    getReplays: async () => [],
    addReplay: async () => null,
    deleteReplay: async () => null,
    getTransactionLedger: async () => [],
    getBurnEvents: async () => [],
    getAirdropRecipients: async () => [],
    executeAirdrop: async () => null,
    getRewardConfig: async () => null,
    updateRewardConfig: async () => null,
  };
}

// Singleton actor instance
let _actor: ReturnType<typeof createRestActor> | null = null;

export function useActor() {
  const { identity, isInitializing } = useAuthStore();

  if (!_actor && identity) {
    _actor = createRestActor();
  }
  if (!identity) {
    _actor = null;
  }

  return {
    actor: identity ? (_actor ?? createRestActor()) : null,
    isFetching: isInitializing,
    ExternalBlob,
  };
}
