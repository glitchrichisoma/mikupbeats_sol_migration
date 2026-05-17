import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type {
  AnalyticsData,
  Beat,
  BeatCategory,
  BeatFilter,
  BeatStyle,
  BeatTexture,
  BurnEventPublic,
  CoverArtEntry,
  DailyCapConfig,
  DailyCapStatus,
  DeliveryMethod,
  GameScore,
  ICRC1Token,
  MIK97TokenSupply,
  Message,
  MigrationLogEntry,
  Milestone,
  Mixtape,
  MixtapeSubmissionFeeConfig,
  MusicLink,
  PageType,
  Platform,
  PreviewEntry,
  ReleaseAuditEntry,
  ReleaseEngineConfig,
  Replay,
  RewardRateConfig,
  RightsFolder,
  RightsType,
  Section,
  ShoppingItem,
  Show,
  Showcase,
  ShowcaseHighlight,
  StripeConfiguration,
  StripeSessionStatus,
  UserProfile,
  UserWalletPublic,
} from "../backend";
import type { ExternalBlob } from "../backend";
import type {
  PoLConfig,
  PoLResetConfig,
  PoLSessionRecord,
  VerifiedListenerBadge,
} from "../types/pol";
import type { PoSPParticipantSession, PoSPRoom } from "../types/posp";
import type { PoSPConfig, PoSPScheduledRoom } from "../types/posp";
import type {
  TransactionLedgerEntry,
  TransactionLedgerFilters,
} from "../types/treasury";
import type {
  DollarValueConfig,
  DynamicRatioConfig,
  DynamicRewardPreviewEntry,
  EmissionStats,
  ForumRewardConfig,
  LiquidityDeploymentLogEntry,
  PerSectionRewardMode,
  PoolActivityEntry,
  PoolDetail,
  ReleaseAuditEntryV2,
  ReleaseSchedule,
  RewardSectionToggles,
} from "../types/treasury";
import { useActor } from "./useActor";

// Admin Check
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// Beats
export function useGetBeats() {
  const { actor, isFetching } = useActor();
  return useQuery<Beat[]>({
    queryKey: ["beats"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBeats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFilterBeats(filter: BeatFilter) {
  const { actor, isFetching } = useActor();
  return useQuery<Beat[]>({
    queryKey: ["beats", "filtered", filter],
    queryFn: async () => {
      if (!actor) return [];
      return actor.filterBeats(filter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetBeat(id: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Beat | null>({
    queryKey: ["beat", id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBeat(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useUploadBeat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      title: string;
      artist: string;
      category: BeatCategory;
      style: BeatStyle;
      texture: BeatTexture;
      coverArt: CoverArtEntry[];
      preview: PreviewEntry;
      rightsFolders: RightsFolder[];
      deliveryMethod: DeliveryMethod;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.uploadBeat(
        params.id,
        params.title,
        params.artist,
        params.category,
        params.style,
        params.texture,
        params.coverArt,
        params.preview,
        params.rightsFolders,
        params.deliveryMethod,
      );
      return params;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beats"] });
    },
  });
}

export function useUpdateBeat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      title: string;
      artist: string;
      category: BeatCategory;
      style: BeatStyle;
      texture: BeatTexture;
      coverArt: CoverArtEntry[];
      preview: PreviewEntry;
      rightsFolders: RightsFolder[];
      deliveryMethod: DeliveryMethod;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.updateBeat(
        params.id,
        params.title,
        params.artist,
        params.category,
        params.style,
        params.texture,
        params.coverArt,
        params.preview,
        params.rightsFolders,
        params.deliveryMethod,
      );
      return params;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beats"] });
      queryClient.invalidateQueries({ queryKey: ["beat"] });
      queryClient.invalidateQueries({ queryKey: ["featuredBeat"] });
    },
  });
}

export function useDeleteBeat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteBeat(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beats"] });
    },
  });
}

// Rights Management - Reopen for Sale
export function useUnmarkRightsAsSold() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { beatId: string; rightsType: RightsType }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.unmarkRightsAsSold(params.beatId, params.rightsType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beats"] });
      queryClient.invalidateQueries({ queryKey: ["beat"] });
      queryClient.invalidateQueries({ queryKey: ["featuredBeat"] });
    },
  });
}

// Showcases
export function useGetApprovedShowcases() {
  const { actor, isFetching } = useActor();
  return useQuery<Showcase[]>({
    queryKey: ["showcases", "approved"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getApprovedShowcases();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPendingShowcases() {
  const { actor, isFetching } = useActor();
  return useQuery<Showcase[]>({
    queryKey: ["showcases", "pending"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingShowcases();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitShowcase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      songName: string;
      artistName: string;
      category: BeatCategory;
      style: BeatStyle;
      texture: BeatTexture;
      beatId: string | null;
      audioFile: ExternalBlob;
      coverArt: ExternalBlob | null;
      externalLink: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitShowcase(
        params.id,
        params.songName,
        params.artistName,
        params.category,
        params.style,
        params.texture,
        params.beatId,
        params.audioFile,
        params.coverArt,
        params.externalLink,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["showcases"] });
    },
  });
}

export function useApproveShowcase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.approveShowcase(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["showcases"] });
    },
  });
}

export function useApproveAllShowcases() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.approveAllShowcases();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["showcases"] });
    },
  });
}

export function useDeleteShowcase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteShowcase(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["showcases"] });
    },
  });
}

// Showcase Highlights (Mixtape Integration)
export function useGetShowcaseHighlights() {
  const { actor, isFetching } = useActor();
  return useQuery<ShowcaseHighlight[]>({
    queryKey: ["showcaseHighlights"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getShowcaseHighlights();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetShowcaseHighlight() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      mixtapeId: string;
      song: ExternalBlob;
      artistName: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setShowcaseHighlight(
        params.mixtapeId,
        params.song,
        params.artistName,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["showcaseHighlights"] });
    },
  });
}

// Mixtapes
export function useGetApprovedMixtapes() {
  const { actor, isFetching } = useActor();
  return useQuery<Mixtape[]>({
    queryKey: ["mixtapes", "approved"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getApprovedMixtapes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPendingMixtapes() {
  const { actor, isFetching } = useActor();
  return useQuery<Mixtape[]>({
    queryKey: ["mixtapes", "pending"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingMixtapes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitMixtape() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      title: string;
      artistName: string;
      description: string;
      coverArt: ExternalBlob | null;
      songs: ExternalBlob[];
      externalLinks: string[];
      stripeSessionId: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitMixtape(
        params.id,
        params.title,
        params.artistName,
        params.description,
        params.coverArt,
        params.songs,
        params.externalLinks,
        params.stripeSessionId,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mixtapes"] });
    },
  });
}

export function useApproveMixtape() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.approveMixtape(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mixtapes"] });
      queryClient.invalidateQueries({ queryKey: ["showcaseHighlights"] });
    },
  });
}

export function useRejectMixtape() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.rejectMixtape(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mixtapes"] });
    },
  });
}

export function useDeleteMixtape() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteMixtape(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mixtapes"] });
      queryClient.invalidateQueries({ queryKey: ["showcaseHighlights"] });
    },
  });
}

// Mixtape Submission Fee Config
export function useGetMixtapeSubmissionFeeConfig() {
  const { actor, isFetching } = useActor();
  return useQuery<MixtapeSubmissionFeeConfig>({
    queryKey: ["mixtapeSubmissionFeeConfig"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getMixtapeSubmissionFeeConfig();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetMixtapeSubmissionFeeConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { enabled: boolean; priceInCents: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setMixtapeSubmissionFeeConfig(
        params.enabled,
        params.priceInCents,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mixtapeSubmissionFeeConfig"],
      });
    },
  });
}

// User Profiles
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// Purchases
export function useGetPurchaseHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["purchaseHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPurchaseHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecordBeatPurchase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      beatId: string;
      sessionId: string;
      isFree: boolean;
      rightsType: RightsType;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.recordBeatPurchase(
        params.beatId,
        params.sessionId,
        params.isFree,
        params.rightsType,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseHistory"] });
      queryClient.invalidateQueries({ queryKey: ["beats"] });
      queryClient.invalidateQueries({ queryKey: ["beat"] });
    },
  });
}

export function useVerifyBeatPurchase(
  beatId: string,
  sessionId: string | null,
) {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["verifyBeatPurchase", beatId, sessionId],
    queryFn: async () => {
      if (!actor) return false;
      return actor.verifyBeatPurchase(beatId, sessionId);
    },
    enabled: !!actor && !isFetching && !!beatId,
  });
}

export function useGetRightsZipFile() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: {
      beatId: string;
      rightsType: RightsType;
      sessionId: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.getRightsZipFile(
        params.beatId,
        params.rightsType,
        params.sessionId,
      );
    },
  });
}

export function useGetGoogleDriveLink() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: {
      beatId: string;
      rightsType: RightsType;
      sessionId: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.getGoogleDriveLink(
        params.beatId,
        params.rightsType,
        params.sessionId,
      );
    },
  });
}

export function useDownloadLicenseFile() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: {
      beatId: string;
      rightsType: RightsType;
      sessionId: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const licenseFiles = await actor.getLicenseFiles(
        params.beatId,
        params.rightsType,
        params.sessionId,
      );
      return licenseFiles;
    },
  });
}

export function useGetLicenseFiles(
  beatId: string,
  rightsType: RightsType,
  sessionId: string | null,
) {
  const { actor, isFetching } = useActor();
  return useQuery<ExternalBlob[]>({
    queryKey: ["licenseFiles", beatId, rightsType, sessionId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLicenseFiles(beatId, rightsType, sessionId);
    },
    enabled: !!actor && !isFetching && !!beatId,
  });
}

// Stripe
export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isStripeConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isStripeConfigured"] });
    },
  });
}

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: {
      items: ShoppingItem[];
      successUrl: string;
      cancelUrl: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.createCheckoutSession(
        params.items,
        params.successUrl,
        params.cancelUrl,
      );
      const session = JSON.parse(result) as { id: string; url: string };
      if (!session?.url) {
        throw new Error("Stripe session missing url");
      }
      return session;
    },
  });
}

export function useGetStripeSessionStatus(sessionId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<StripeSessionStatus>({
    queryKey: ["stripeSessionStatus", sessionId],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getStripeSessionStatus(sessionId);
    },
    enabled: !!actor && !isFetching && !!sessionId,
  });
}

// User Approval
export function useIsCallerApproved() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isCallerApproved"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerApproved();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRequestApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.requestApproval();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isCallerApproved"] });
    },
  });
}

// M.v.A Preview
export function useGetMvaPreview() {
  const { actor, isFetching } = useActor();
  return useQuery<ExternalBlob | null>({
    queryKey: ["mvaPreview"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMvaPreview();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUploadMvaPreview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reference: ExternalBlob) => {
      if (!actor) throw new Error("Actor not available");
      return actor.uploadMvaPreview(reference);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mvaPreview"] });
    },
  });
}

export function useDeleteMvaPreview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteMvaPreview();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mvaPreview"] });
    },
  });
}

// Music Links
export function useGetMusicLinks() {
  const { actor, isFetching } = useActor();
  return useQuery<MusicLink[]>({
    queryKey: ["musicLinks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMusicLinks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddMusicLink() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      platform: Platform;
      url: string;
      releaseDate: string | null;
      coverArt: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addMusicLink(
        params.title,
        params.platform,
        params.url,
        params.releaseDate,
        params.coverArt,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["musicLinks"] });
    },
  });
}

export function useUpdateMusicLink() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      platform: Platform;
      url: string;
      releaseDate: string | null;
      coverArt: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateMusicLink(
        params.title,
        params.platform,
        params.url,
        params.releaseDate,
        params.coverArt,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["musicLinks"] });
    },
  });
}

export function useDeleteMusicLink() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteMusicLink(title);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["musicLinks"] });
    },
  });
}

// Featured Beat
export function useGetFeaturedBeat() {
  const { actor, isFetching } = useActor();
  return useQuery<Beat | null>({
    queryKey: ["featuredBeat"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getFeaturedBeat();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetFeaturedBeat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (beatId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setFeaturedBeat(beatId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featuredBeat"] });
    },
  });
}

export function useClearFeaturedBeat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.clearFeaturedBeat();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featuredBeat"] });
    },
  });
}

// Live Shows
export function useGetUpcomingShows() {
  const { actor, isFetching } = useActor();
  return useQuery<Show[]>({
    queryKey: ["upcomingShows"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUpcomingShows();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddUpcomingShow() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      title: string;
      date: string;
      time: string;
      description: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addUpcomingShow(
        params.id,
        params.title,
        params.date,
        params.time,
        params.description,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upcomingShows"] });
    },
  });
}

export function useUpdateUpcomingShow() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      title: string;
      date: string;
      time: string;
      description: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateUpcomingShow(
        params.id,
        params.title,
        params.date,
        params.time,
        params.description,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upcomingShows"] });
    },
  });
}

export function useDeleteUpcomingShow() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteUpcomingShow(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upcomingShows"] });
    },
  });
}

// Replays
export function useGetReplays() {
  const { actor, isFetching } = useActor();
  return useQuery<Replay[]>({
    queryKey: ["replays"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReplays();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddReplay() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      title: string;
      description: string;
      replayUrl: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addReplay(
        params.id,
        params.title,
        params.description,
        params.replayUrl,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replays"] });
    },
  });
}

export function useUpdateReplay() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      title: string;
      description: string;
      replayUrl: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateReplay(
        params.id,
        params.title,
        params.description,
        params.replayUrl,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replays"] });
    },
  });
}

export function useDeleteReplay() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteReplay(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replays"] });
    },
  });
}

// Forum Sections
export function useGetSections() {
  const { actor, isFetching } = useActor();
  return useQuery<Section[]>({
    queryKey: ["sections"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSections();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSection(id: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Section | null>({
    queryKey: ["section", id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSection(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useCreateSection() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      title: string;
      description: string;
      linkSharingEnabled: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createSection(
        params.id,
        params.title,
        params.description,
        params.linkSharingEnabled,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
    },
  });
}

export function useDeleteSection() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteSection(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
    },
  });
}

export function useGetSectionLinkSharing() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["sectionLinkSharing"],
    queryFn: async () => {
      if (!actor) return false;
      return false;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetSectionLinkSharing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; enabled: boolean }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setSectionLinkSharing(params.id, params.enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      queryClient.invalidateQueries({ queryKey: ["section"] });
      queryClient.invalidateQueries({ queryKey: ["sectionLinkSharing"] });
    },
  });
}

// Forum Messages
export function useGetMessages(sectionId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Message[]>({
    queryKey: ["messages", sectionId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMessages(sectionId);
    },
    enabled: !!actor && !isFetching && !!sectionId,
    refetchInterval: 3000,
  });
}

export function useAddMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      sectionId: string;
      id: string;
      message: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addMessage(params.sectionId, params.id, params.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.sectionId],
      });
    },
  });
}

export function useDeleteMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteMessage(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

// Milestones
export function useGetMilestones() {
  const { actor, isFetching } = useActor();
  return useQuery<Milestone[]>({
    queryKey: ["milestones"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMilestones();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveMilestone() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; milestone: Milestone }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveMilestone(params.id, params.milestone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
    },
  });
}

export function useDeleteMilestone() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteMilestone(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
    },
  });
}

export function useUpdateMilestoneOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (milestoneIds: [string, bigint][]) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateMilestoneOrder(milestoneIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
    },
  });
}

// License Management
export function useGetBasicRightsLicense() {
  const { actor, isFetching } = useActor();
  return useQuery<ExternalBlob | null>({
    queryKey: ["basicRightsLicense"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBasicRightsLicense();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUploadBasicRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (license: ExternalBlob) => {
      if (!actor) throw new Error("Actor not available");
      return actor.uploadBasicRightsLicense(license);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["basicRightsLicense"] });
    },
  });
}

export function useUpdateBasicRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (license: ExternalBlob) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateBasicRightsLicense(license);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["basicRightsLicense"] });
    },
  });
}

export function useDeleteBasicRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteBasicRightsLicense();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["basicRightsLicense"] });
    },
  });
}

export function useGetPremiumRightsLicense() {
  const { actor, isFetching } = useActor();
  return useQuery<ExternalBlob | null>({
    queryKey: ["premiumRightsLicense"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPremiumRightsLicense();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUploadPremiumRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (license: ExternalBlob) => {
      if (!actor) throw new Error("Actor not available");
      return actor.uploadPremiumRightsLicense(license);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["premiumRightsLicense"] });
    },
  });
}

export function useUpdatePremiumRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (license: ExternalBlob) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updatePremiumRightsLicense(license);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["premiumRightsLicense"] });
    },
  });
}

export function useDeletePremiumRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.deletePremiumRightsLicense();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["premiumRightsLicense"] });
    },
  });
}

export function useGetExclusiveRightsLicense() {
  const { actor, isFetching } = useActor();
  return useQuery<ExternalBlob | null>({
    queryKey: ["exclusiveRightsLicense"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getExclusiveRightsLicense();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUploadExclusiveRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (license: ExternalBlob) => {
      if (!actor) throw new Error("Actor not available");
      return actor.uploadExclusiveRightsLicense(license);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exclusiveRightsLicense"] });
    },
  });
}

export function useUpdateExclusiveRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (license: ExternalBlob) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateExclusiveRightsLicense(license);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exclusiveRightsLicense"] });
    },
  });
}

export function useDeleteExclusiveRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteExclusiveRightsLicense();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exclusiveRightsLicense"] });
    },
  });
}

export function useGetStemsRightsLicense() {
  const { actor, isFetching } = useActor();
  return useQuery<ExternalBlob | null>({
    queryKey: ["stemsRightsLicense"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getStemsRightsLicense();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUploadStemsRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (license: ExternalBlob) => {
      if (!actor) throw new Error("Actor not available");
      return actor.uploadStemsRightsLicense(license);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stemsRightsLicense"] });
    },
  });
}

export function useUpdateStemsRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (license: ExternalBlob) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateStemsRightsLicense(license);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stemsRightsLicense"] });
    },
  });
}

export function useDeleteStemsRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteStemsRightsLicense();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stemsRightsLicense"] });
    },
  });
}

// Analytics
export function useGetAnalytics() {
  const { actor, isFetching } = useActor();
  return useQuery<AnalyticsData>({
    queryKey: ["analytics"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getAnalytics();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecordSiteVisit() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (page: PageType) => {
      if (!actor) throw new Error("Actor not available");
      return actor.recordSiteVisit(page);
    },
  });
}

export function useAddExcludedVisitor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addExcludedVisitor(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["excludedVisitors"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useRemoveExcludedVisitor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error("Actor not available");
      return actor.removeExcludedVisitor(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["excludedVisitors"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useIsExcludedVisitor(principal: Principal) {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isExcludedVisitor", principal.toString()],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isExcludedVisitor(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useGetExcludedVisitors() {
  const { actor, isFetching } = useActor();
  return useQuery<Principal[]>({
    queryKey: ["excludedVisitors"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExcludedVisitors();
    },
    enabled: !!actor && !isFetching,
  });
}

// YouTube Live URL
export function useGetYouTubeLiveUrl() {
  const [url, setUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUrl = localStorage.getItem("youtubeLiveUrl");
    if (storedUrl) {
      setUrl(storedUrl);
    }
    setIsLoading(false);
  }, []);

  const saveUrl = (newUrl: string) => {
    localStorage.setItem("youtubeLiveUrl", newUrl);
    setUrl(newUrl);
  };

  const deleteUrl = () => {
    localStorage.removeItem("youtubeLiveUrl");
    setUrl("");
  };

  return { url, saveUrl, deleteUrl, isLoading };
}

// ── MIK97 Wallet ─────────────────────────────────────────────────────────────

export function useUserWallet() {
  const { actor, isFetching } = useActor();
  return useQuery<UserWalletPublic | null>({
    queryKey: ["userWallet"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserWallet();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useCreateOrGetWallet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.createOrGetWallet();
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userWallet"] });
    },
  });
}

export function useTokenSupply() {
  const { actor, isFetching } = useActor();
  return useQuery<MIK97TokenSupply | null>({
    queryKey: ["tokenSupply"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getTokenSupply();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchInterval: 30_000,
  });
}

// ── MIK97 Release Engine ──────────────────────────────────────────────────────

export function useReleaseEngineConfig() {
  const { actor, isFetching } = useActor();
  return useQuery<ReleaseEngineConfig | null>({
    queryKey: ["releaseEngineConfig"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getReleaseEngineConfig();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useEmissionStats() {
  const { actor, isFetching } = useActor();
  return useQuery<EmissionStats | null>({
    queryKey: ["emissionStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getEmissionStats();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchInterval: 30_000,
  });
}

export function useReleaseAuditLog() {
  const { actor, isFetching } = useActor();
  return useQuery<ReleaseAuditEntry[]>({
    queryKey: ["releaseAuditLog"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReleaseAuditLog();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useUpdateReleaseEngineConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: ReleaseEngineConfig) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.updateReleaseEngineConfig(config);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releaseEngineConfig"] });
    },
  });
}

// ── MIK97 Reward Rate & Daily Cap Config ─────────────────────────────────────

export function useGetRewardRateConfig() {
  const { actor, isFetching } = useActor();
  return useQuery<RewardRateConfig | null>({
    queryKey: ["rewardRateConfig"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getRewardRateConfig();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useUpdateRewardRateConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: RewardRateConfig) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.updateRewardRateConfig(config);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewardRateConfig"] });
    },
  });
}

export function useGetDailyCapConfig() {
  const { actor, isFetching } = useActor();
  return useQuery<DailyCapConfig | null>({
    queryKey: ["dailyCapConfig"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDailyCapConfig();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useUpdateDailyCapConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: DailyCapConfig) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.updateDailyCapConfig(config);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyCapConfig"] });
    },
  });
}

export function useTriggerManualRelease() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { poolName: string; amount: bigint }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.triggerManualRelease(
        params.poolName,
        Number(params.amount),
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emissionStats"] });
      queryClient.invalidateQueries({ queryKey: ["releaseAuditLog"] });
      queryClient.invalidateQueries({ queryKey: ["tokenSupply"] });
    },
  });
}

export function useCheckAndAutoRelease() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.checkAndAutoRelease();
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok ? [result.ok] : ([] as ReleaseAuditEntry[]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emissionStats"] });
      queryClient.invalidateQueries({ queryKey: ["releaseAuditLog"] });
      queryClient.invalidateQueries({ queryKey: ["tokenSupply"] });
    },
  });
}

export function useEmergencyPauseAll() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pause: boolean) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.emergencyPauseAll(pause);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releaseEngineConfig"] });
      queryClient.invalidateQueries({ queryKey: ["emissionStats"] });
    },
  });
}

// ── MIK97 Earn / Game Hooks ───────────────────────────────────────────────────

export function useEarnTokens() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      category: string;
      points: bigint;
      gameType: string | null;
      description: string | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.earnTokens(
        params.category,
        params.points,
        params.gameType,
        params.description,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userWallet"] });
      queryClient.invalidateQueries({ queryKey: ["dailyCapStatus"] });
    },
  });
}

export function useSubmitGameScore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { gameType: string; score: bigint }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.submitGameScore(params.gameType, params.score);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userWallet"] });
      queryClient.invalidateQueries({ queryKey: ["dailyCapStatus"] });
      queryClient.invalidateQueries({ queryKey: ["gameLeaderboard"] });
    },
  });
}

export function useDailyCapStatus() {
  const { actor, isFetching } = useActor();
  return useQuery<DailyCapStatus | null>({
    queryKey: ["dailyCapStatus"],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getDailyCapStatus();
      if (result.__kind__ === "err") return null;
      return result.ok;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useGameLeaderboard(gameType: string) {
  const { actor, isFetching } = useActor();
  return useQuery<GameScore[]>({
    queryKey: ["gameLeaderboard", gameType],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getGameLeaderboard(gameType);
    },
    enabled: !!actor && !isFetching && !!gameType,
    staleTime: 60_000,
  });
}

// ── MIK97 Burn System ─────────────────────────────────────────────────────────

export function useBurnTokens() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      amount: bigint;
      useCase: string;
      beatId?: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.burnTokens(
        Number(params.amount),
        params.useCase,
        params.beatId ?? null,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userWallet"] });
      queryClient.invalidateQueries({ queryKey: ["burnStats"] });
      queryClient.invalidateQueries({ queryKey: ["tokenSupply"] });
    },
  });
}

export function useApplyTokenDiscount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      tokensToSpend: number;
      useCase: string;
      beatId?: string;
      rightsType?: string;
      /** priceInCents is used to cap tokensToSpend before sending to backend */
      priceInCents?: number;
    }) => {
      if (!actor) throw new Error("Not connected");

      // Cap tokens so they never exceed what's needed to zero out the price
      const tokensNeededToMakeItFree =
        params.priceInCents != null
          ? params.priceInCents
          : params.tokensToSpend;
      const cappedTokens =
        params.priceInCents != null
          ? params.tokensToSpend > tokensNeededToMakeItFree
            ? tokensNeededToMakeItFree
            : params.tokensToSpend
          : params.tokensToSpend;

      const result = await actor.applyTokenDiscount(
        cappedTokens,
        BigInt(params.priceInCents ?? 0),
        params.useCase,
        params.beatId ?? null,
        params.rightsType ?? params.useCase,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      const discountUsd = result.ok as unknown as number;
      return {
        discountApplied: discountUsd,
        tokensActuallyBurned: cappedTokens,
        remainingBalance: 0,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userWallet"] });
      queryClient.invalidateQueries({ queryKey: ["burnStats"] });
      queryClient.invalidateQueries({ queryKey: ["tokenSupply"] });
    },
  });
}

export function useGetBurnStats() {
  const { actor, isFetching } = useActor();
  return useQuery<{
    totalBurned: number;
    burnByUseCase: [string, number][];
    recentBurns: BurnEventPublic[];
  } | null>({
    queryKey: ["burnStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBurnStats();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

// ── MIK97 Music Listening Rewards ─────────────────────────────────────────────
// ── PoL: Proof of Listening ───────────────────────────────────────────────────

export function useGetMyPoLBadges() {
  const { actor, isFetching } = useActor();
  return useQuery<VerifiedListenerBadge[]>({
    queryKey: ["myPoLBadges"],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as unknown as {
        getMyPoLBadges?: () => Promise<
          Array<{
            tier: string;
            earnedAt: bigint | number;
            confidenceAtEarning: number;
            sessionCount: bigint | number;
          }>
        >;
      };
      if (!a.getMyPoLBadges) return [];
      try {
        const raw = await a.getMyPoLBadges();
        return raw.map((b) => ({
          tier: b.tier as VerifiedListenerBadge["tier"],
          earnedAt: Number(b.earnedAt) / 1_000_000,
          confidenceAtEarning: Number(b.confidenceAtEarning),
          sessionCount: Number(b.sessionCount),
        }));
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useGetPoLConfig() {
  const { actor, isFetching } = useActor();
  return useQuery<PoLConfig>({
    queryKey: ["polConfig"],
    queryFn: async () => {
      const defaults: PoLConfig = {
        enabled: true,
        minConfidenceThreshold: 10,
        rewardMultiplier: 1.0,
        bronzeThreshold: 1,
        silverThreshold: 34,
        goldThreshold: 67,
      };
      if (!actor) return defaults;
      const a = actor as unknown as {
        getPoLConfig?: () => Promise<PoLConfig>;
      };
      if (!a.getPoLConfig) {
        // Fall back to localStorage config
        const stored = localStorage.getItem("mik97_pol_config");
        if (stored) {
          try {
            return {
              ...defaults,
              ...(JSON.parse(stored) as Partial<PoLConfig>),
            };
          } catch {
            /**/
          }
        }
        return defaults;
      }
      try {
        const raw = await a.getPoLConfig();
        return { ...defaults, ...raw };
      } catch {
        const stored = localStorage.getItem("mik97_pol_config");
        if (stored) {
          try {
            return {
              ...defaults,
              ...(JSON.parse(stored) as Partial<PoLConfig>),
            };
          } catch {
            /**/
          }
        }
        return defaults;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useSetPoLConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: PoLConfig) => {
      // Always persist locally so settings survive even if backend method absent
      localStorage.setItem("mik97_pol_config", JSON.stringify(config));
      if (!actor) return config;
      const a = actor as unknown as {
        setPoLConfig?: (
          c: PoLConfig,
        ) => Promise<{ ok: string } | { err: string }>;
      };
      if (!a.setPoLConfig) return config;
      try {
        const result = await a.setPoLConfig(config);
        if ("err" in result) throw new Error(result.err);
      } catch {
        /**/
      }
      return config;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polConfig"] });
    },
  });
}

// ── PoL Reset Config ─────────────────────────────────────────────────────────

const POL_RESET_DEFAULTS: PoLResetConfig = {
  resetEnabled: false,
  resetIntervalDays: 7,
  resetTimeOfDayHours: 0,
};

export function useGetPoLResetConfig() {
  const { actor, isFetching } = useActor();
  return useQuery<PoLResetConfig>({
    queryKey: ["polResetConfig"],
    queryFn: async () => {
      if (!actor) return POL_RESET_DEFAULTS;
      const a = actor as unknown as {
        getPoLResetConfig?: () => Promise<PoLResetConfig>;
      };
      if (!a.getPoLResetConfig) {
        const stored = localStorage.getItem("mik97_pol_reset_config");
        if (stored) {
          try {
            return {
              ...POL_RESET_DEFAULTS,
              ...(JSON.parse(stored) as Partial<PoLResetConfig>),
            };
          } catch {
            /**/
          }
        }
        return POL_RESET_DEFAULTS;
      }
      try {
        const raw = await a.getPoLResetConfig();
        return { ...POL_RESET_DEFAULTS, ...raw };
      } catch {
        const stored = localStorage.getItem("mik97_pol_reset_config");
        if (stored) {
          try {
            return {
              ...POL_RESET_DEFAULTS,
              ...(JSON.parse(stored) as Partial<PoLResetConfig>),
            };
          } catch {
            /**/
          }
        }
        return POL_RESET_DEFAULTS;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useSetPoLResetConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: PoLResetConfig) => {
      localStorage.setItem("mik97_pol_reset_config", JSON.stringify(config));
      if (!actor) return config;
      const a = actor as unknown as {
        setPoLResetConfig?: (c: PoLResetConfig) => Promise<void>;
      };
      if (!a.setPoLResetConfig) return config;
      try {
        await a.setPoLResetConfig(config);
      } catch {
        /**/
      }
      return config;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polResetConfig"] });
      queryClient.invalidateQueries({ queryKey: ["polNextResetTime"] });
    },
  });
}

export function useGetNextPoLResetTime() {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ["polNextResetTime"],
    queryFn: async () => {
      if (!actor) return 0;
      const a = actor as unknown as {
        getNextPoLResetTime?: () => Promise<bigint | number>;
      };
      if (!a.getNextPoLResetTime) return 0;
      try {
        const raw = await a.getNextPoLResetTime();
        // Backend returns nanoseconds; convert to milliseconds for Date
        return Number(raw) / 1_000_000;
      } catch {
        return 0;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

// ── PoSP Config Stubs (Layer 2) ──────────────────────────────────────────────────────

const POSP_CONFIG_DEFAULTS: PoSPConfig = {
  layer2Enabled: false,
  defaultRoomCapacity: 20,
  defaultRoomDurationMinutes: 60,
  minGroupSize: 2,
  consensusWindowMinutes: 3,
  nativeRewardRatePerMinute: 0.5,
  externalRewardRatePerMinute: 0.2,
  minActiveTimePercent: 80,
  hostFeeEnabled: false,
  hostFeeAmount: 10,
  autoRoomEnabled: false,
  autoRoomPlayCountThreshold: 50,
  maxScheduledRoomsPerDay: 5,
};

export function useGetPoSPConfig() {
  const { actor, isFetching } = useActor();
  return useQuery<PoSPConfig>({
    queryKey: ["pospConfig"],
    queryFn: async () => {
      if (!actor) return POSP_CONFIG_DEFAULTS;
      const a = actor as unknown as {
        getPoSPConfig?: () => Promise<PoSPConfig>;
      };
      if (!a.getPoSPConfig) {
        const stored = localStorage.getItem("mik97_posp_config");
        if (stored) {
          try {
            return {
              ...POSP_CONFIG_DEFAULTS,
              ...(JSON.parse(stored) as Partial<PoSPConfig>),
            };
          } catch {
            /**/
          }
        }
        return POSP_CONFIG_DEFAULTS;
      }
      try {
        const raw = await a.getPoSPConfig();
        return { ...POSP_CONFIG_DEFAULTS, ...raw };
      } catch {
        const stored = localStorage.getItem("mik97_posp_config");
        if (stored) {
          try {
            return {
              ...POSP_CONFIG_DEFAULTS,
              ...(JSON.parse(stored) as Partial<PoSPConfig>),
            };
          } catch {
            /**/
          }
        }
        return POSP_CONFIG_DEFAULTS;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useSetPoSPConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: PoSPConfig) => {
      localStorage.setItem("mik97_posp_config", JSON.stringify(config));
      if (!actor) return config;
      const a = actor as unknown as {
        setPoSPConfig?: (
          c: PoSPConfig,
        ) => Promise<{ ok: string } | { err: string }>;
      };
      if (!a.setPoSPConfig) return config;
      try {
        const result = await a.setPoSPConfig(config);
        if ("err" in result) throw new Error(result.err);
      } catch {
        /**/
      }
      return config;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pospConfig"] });
    },
  });
}

export function useGetScheduledRooms() {
  const { actor, isFetching } = useActor();
  return useQuery<PoSPScheduledRoom[]>({
    queryKey: ["pospScheduledRooms"],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as unknown as {
        getScheduledPoSPRooms?: () => Promise<PoSPScheduledRoom[]>;
      };
      if (!a.getScheduledPoSPRooms) {
        const stored = localStorage.getItem("mik97_posp_scheduled_rooms");
        if (stored) {
          try {
            return JSON.parse(stored) as PoSPScheduledRoom[];
          } catch {
            /**/
          }
        }
        return [];
      }
      try {
        return await a.getScheduledPoSPRooms();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useScheduleRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      title: string;
      contentUrl: string;
      contentType: "Native" | "External";
      scheduledAt: number;
      durationMinutes: number;
      capacity: number;
    }) => {
      // Persist locally as a stub
      const stored = localStorage.getItem("mik97_posp_scheduled_rooms");
      const existing: PoSPScheduledRoom[] = stored
        ? (JSON.parse(stored) as PoSPScheduledRoom[])
        : [];
      const newRoom: PoSPScheduledRoom = {
        id: `sched_${Date.now()}`,
        ...params,
        status: "Scheduled",
      };
      localStorage.setItem(
        "mik97_posp_scheduled_rooms",
        JSON.stringify([...existing, newRoom]),
      );
      if (!actor) return newRoom;
      const a = actor as unknown as {
        schedulePoSPRoom?: (
          p: typeof params,
        ) => Promise<{ ok: string } | { err: string }>;
      };
      if (!a.schedulePoSPRoom) return newRoom;
      try {
        const result = await a.schedulePoSPRoom(params);
        if ("err" in result) throw new Error(result.err);
      } catch {
        /**/
      }
      return newRoom;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pospScheduledRooms"] });
    },
  });
}

export function useCancelScheduledRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: string) => {
      // Update local stub
      const stored = localStorage.getItem("mik97_posp_scheduled_rooms");
      if (stored) {
        try {
          const rooms = JSON.parse(stored) as PoSPScheduledRoom[];
          const updated = rooms
            .map((r) =>
              r.id === roomId ? { ...r, status: "Cancelled" as const } : r,
            )
            .filter((r) => r.status !== "Cancelled");
          localStorage.setItem(
            "mik97_posp_scheduled_rooms",
            JSON.stringify(updated),
          );
        } catch {
          /**/
        }
      }
      if (!actor) return;
      const a = actor as unknown as {
        cancelScheduledPoSPRoom?: (id: string) => Promise<void>;
      };
      if (!a.cancelScheduledPoSPRoom) return;
      try {
        await a.cancelScheduledPoSPRoom(roomId);
      } catch {
        /**/
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pospScheduledRooms"] });
    },
  });
}

// ─── PoSP Active Rooms & Room Actions ─────────────────────────────────────────

export function useGetActiveRooms() {
  const { actor, isFetching } = useActor();
  return useQuery<PoSPRoom[]>({
    queryKey: ["pospActiveRooms"],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as unknown as {
        getActiveRooms?: () => Promise<PoSPRoom[]>;
      };
      if (!a.getActiveRooms) return [];
      try {
        return await a.getActiveRooms();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

export function useCreatePresenceRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      title: string;
      contentUrl: string;
      durationMinutes: number;
      capacity: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        createPresenceRoom?: (
          title: string,
          contentUrl: string,
          durationMinutes: bigint,
          capacity: bigint,
        ) => Promise<{ ok: string } | { err: string }>;
      };
      if (!a.createPresenceRoom) {
        return params.title;
      }
      const result = await a.createPresenceRoom(
        params.title,
        params.contentUrl,
        BigInt(params.durationMinutes),
        BigInt(params.capacity),
      );
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pospActiveRooms"] });
    },
  });
}

export function useJoinRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        joinRoom?: (id: string) => Promise<{ ok: null } | { err: string }>;
      };
      if (!a.joinRoom) return;
      const result = await a.joinRoom(roomId);
      if ("err" in result) throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pospActiveRooms"] });
      queryClient.invalidateQueries({ queryKey: ["myRoomSessions"] });
    },
  });
}

export function useLeaveRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!actor) return;
      const a = actor as unknown as {
        leaveRoom?: (id: string) => Promise<{ ok: null } | { err: string }>;
      };
      if (!a.leaveRoom) return;
      try {
        const result = await a.leaveRoom(roomId);
        if ("err" in result) throw new Error(result.err);
      } catch {
        /**/
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pospActiveRooms"] });
    },
  });
}

export function useRecordHeartbeat() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (params: {
      roomId: string;
      interactionCheckPassed: boolean;
    }) => {
      if (!actor) return;
      const a = actor as unknown as {
        recordPresenceHeartbeat?: (
          id: string,
          passed: boolean,
        ) => Promise<{ ok: null } | { err: string }>;
      };
      if (!a.recordPresenceHeartbeat) return;
      try {
        await a.recordPresenceHeartbeat(
          params.roomId,
          params.interactionCheckPassed,
        );
      } catch {
        /**/
      }
    },
  });
}

export function useClaimRoomReward() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: string): Promise<number> => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        claimRoomReward?: (
          id: string,
        ) => Promise<{ ok: bigint } | { err: string }>;
      };
      if (!a.claimRoomReward) return 0;
      const result = await a.claimRoomReward(roomId);
      if ("err" in result) throw new Error(result.err);
      return Number(result.ok);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myRoomSessions"] });
      queryClient.invalidateQueries({ queryKey: ["pospStats"] });
    },
  });
}

export function useGetMyRoomSessions() {
  const { actor, isFetching } = useActor();
  return useQuery<PoSPParticipantSession[]>({
    queryKey: ["myRoomSessions"],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as unknown as {
        getMyRoomSessions?: () => Promise<PoSPParticipantSession[]>;
      };
      if (!a.getMyRoomSessions) return [];
      try {
        return await a.getMyRoomSessions();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useGetRoomParticipants(roomId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<PoSPParticipantSession[]>({
    queryKey: ["roomParticipants", roomId],
    queryFn: async () => {
      if (!actor || !roomId) return [];
      const a = actor as unknown as {
        getRoomParticipants?: (id: string) => Promise<PoSPParticipantSession[]>;
      };
      if (!a.getRoomParticipants) return [];
      try {
        return await a.getRoomParticipants(roomId);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!roomId,
    refetchInterval: 10_000,
    staleTime: 8_000,
  });
}

export function useGetPoSPStats() {
  const { actor, isFetching } = useActor();
  return useQuery<{
    totalRooms: number;
    activeRooms: number;
    totalRewardsPaid: number;
    totalVerifiedSessions: number;
  }>({
    queryKey: ["pospStats"],
    queryFn: async () => {
      const defaults = {
        totalRooms: 0,
        activeRooms: 0,
        totalRewardsPaid: 0,
        totalVerifiedSessions: 0,
      };
      if (!actor) return defaults;
      const a = actor as unknown as {
        getPoSPStats?: () => Promise<{
          totalRooms: bigint;
          activeRooms: bigint;
          totalRewardsPaid: bigint;
          totalVerifiedSessions: bigint;
        }>;
      };
      if (!a.getPoSPStats) return defaults;
      try {
        const raw = await a.getPoSPStats();
        return {
          totalRooms: Number(raw.totalRooms),
          activeRooms: Number(raw.activeRooms),
          totalRewardsPaid: Number(raw.totalRewardsPaid),
          totalVerifiedSessions: Number(raw.totalVerifiedSessions),
        };
      } catch {
        return defaults;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useGetMyPoLSessions(limit = 10) {
  const { actor, isFetching } = useActor();
  return useQuery<PoLSessionRecord[]>({
    queryKey: ["myPoLSessions", limit],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as unknown as {
        getMyPoLSessions?: (limit: bigint) => Promise<
          Array<{
            sessionId: string;
            contentId: string;
            contentType: string;
            confidenceScore: number;
            tokensEarned: number;
            timestamp: bigint | number;
            playbackDurationMs: bigint | number;
          }>
        >;
      };
      if (!a.getMyPoLSessions) return [];
      try {
        const raw = await a.getMyPoLSessions(BigInt(limit));
        return raw.map((s) => ({
          sessionId: s.sessionId,
          contentId: s.contentId,
          contentType: s.contentType,
          confidenceScore: Number(s.confidenceScore),
          tokensEarned: Number(s.tokensEarned),
          timestamp: Number(s.timestamp) / 1_000_000,
          playbackDurationMs: Number(s.playbackDurationMs),
        }));
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useRecordMusicReward() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      contentType: string;
      contentId: string;
      rewardType: string;
      sessionId?: string;
      confidenceScore?: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      // Try extended signature with PoL confidence score first;
      // fall back to the 3-arg legacy signature for older backends.
      const a = actor as unknown as {
        recordMusicReward(
          contentType: string,
          contentId: string,
          rewardType: string,
          sessionId?: string,
          confidenceScore?: number,
        ): Promise<
          | { __kind__: "ok"; ok: bigint }
          | { __kind__: "err"; err: string }
          | { __kind__: "cooldown" }
        >;
      };
      let result: Awaited<ReturnType<typeof a.recordMusicReward>>;
      if (
        params.sessionId !== undefined ||
        params.confidenceScore !== undefined
      ) {
        try {
          result = await a.recordMusicReward(
            params.contentType,
            params.contentId,
            params.rewardType,
            params.sessionId ?? "",
            params.confidenceScore ?? 100,
          );
        } catch {
          // Backend doesn’t support extended args — fall back
          result = await a.recordMusicReward(
            params.contentType,
            params.contentId,
            params.rewardType,
          );
        }
      } else {
        result = await a.recordMusicReward(
          params.contentType,
          params.contentId,
          params.rewardType,
        );
      }
      if (result.__kind__ === "err") throw new Error(result.err);
      if (result.__kind__ === "cooldown") return BigInt(0);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userWallet"] });
      queryClient.invalidateQueries({ queryKey: ["dailyCapStatus"] });
      queryClient.invalidateQueries({ queryKey: ["myPoLBadges"] });
      queryClient.invalidateQueries({ queryKey: ["myPoLSessions"] });
    },
  });
}

export function useGetMusicRewardStatus(
  contentId: string,
  contentType: string,
) {
  const { actor, isFetching } = useActor();
  return useQuery<{
    alreadyEarned: boolean;
    dailyCapRemaining: number;
    cooldownDaysLeft: bigint;
  } | null>({
    queryKey: ["musicRewardStatus", contentType, contentId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMusicRewardStatus(contentId, contentType);
    },
    enabled: !!actor && !isFetching && !!contentId,
    staleTime: 30_000,
  });
}

// ── MIK97 Bonus Earning Config ────────────────────────────────────────────────

export interface BonusEarningConfig {
  loginBonusTokens: number;
  streakBonusTokens: number;
  streakTarget: bigint;
  showcaseUploadBonusTokens: number;
  purchaseCashbackPercent: number;
  /** Controls whether showcase upload rewards are paid out. Backend field — always sent. */
  showcaseUploadRewardEnabled: boolean;
  /** Controls whether mixtape/album upload rewards are paid out. Backend field — always sent. */
  mixtapeUploadRewardEnabled: boolean;
}

export function useGetBonusEarningConfig() {
  const { actor, isFetching } = useActor();
  return useQuery<BonusEarningConfig | null>({
    queryKey: ["bonusEarningConfig"],
    queryFn: async () => {
      if (!actor) return null;
      const a = actor as unknown as {
        getBonusEarningConfig: () => Promise<BonusEarningConfig>;
      };
      // Safe defaults used when backend record is missing newly-added fields
      const safeDefaults: BonusEarningConfig = {
        loginBonusTokens: 1,
        streakBonusTokens: 5,
        streakTarget: 7n,
        showcaseUploadBonusTokens: 10,
        purchaseCashbackPercent: 0,
        showcaseUploadRewardEnabled: true,
        mixtapeUploadRewardEnabled: true,
      };
      let base: BonusEarningConfig;
      try {
        const raw = await a.getBonusEarningConfig();
        // Merge with defaults — ensures both Bool fields are always present
        // even if the stored backend record predates them.
        base = {
          ...safeDefaults,
          ...raw,
          showcaseUploadRewardEnabled:
            (raw as Partial<BonusEarningConfig>).showcaseUploadRewardEnabled ??
            true,
          mixtapeUploadRewardEnabled:
            (raw as Partial<BonusEarningConfig>).mixtapeUploadRewardEnabled ??
            true,
        };
      } catch {
        // Backend record missing keys — fall back to safe defaults
        base = safeDefaults;
      }
      // Merge with locally persisted reward lock states (takes priority)
      const stored = localStorage.getItem("mik97_bonus_reward_locks");
      if (stored) {
        try {
          const locks = JSON.parse(stored) as Partial<BonusEarningConfig>;
          return {
            ...base,
            showcaseUploadRewardEnabled:
              locks.showcaseUploadRewardEnabled ??
              base.showcaseUploadRewardEnabled,
            mixtapeUploadRewardEnabled:
              locks.mixtapeUploadRewardEnabled ??
              base.mixtapeUploadRewardEnabled,
          };
        } catch {
          // ignore parse error
        }
      }
      return base;
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useUpdateBonusEarningConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: BonusEarningConfig) => {
      if (!actor) throw new Error("Not connected");
      // Persist the frontend-only lock flags to localStorage
      localStorage.setItem(
        "mik97_bonus_reward_locks",
        JSON.stringify({
          showcaseUploadRewardEnabled:
            config.showcaseUploadRewardEnabled ?? true,
          mixtapeUploadRewardEnabled: config.mixtapeUploadRewardEnabled ?? true,
        }),
      );
      const a = actor as unknown as {
        updateBonusEarningConfig: (
          c: BonusEarningConfig,
        ) => Promise<
          | { __kind__: "ok"; ok: BonusEarningConfig }
          | { __kind__: "err"; err: string }
        >;
      };
      // Always include both Bool fields — backend requires the full record.
      // Default to true (enabled) when not provided to avoid "Record is missing key" errors.
      const backendConfig: BonusEarningConfig = {
        loginBonusTokens: config.loginBonusTokens,
        streakBonusTokens: config.streakBonusTokens,
        streakTarget: config.streakTarget,
        showcaseUploadBonusTokens: config.showcaseUploadBonusTokens,
        purchaseCashbackPercent: config.purchaseCashbackPercent,
        showcaseUploadRewardEnabled: config.showcaseUploadRewardEnabled ?? true,
        mixtapeUploadRewardEnabled: config.mixtapeUploadRewardEnabled ?? true,
      };
      const result = await a.updateBonusEarningConfig(backendConfig);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bonusEarningConfig"] });
    },
  });
}

// ── MIK97 Mixtape Upload Reward Config ───────────────────────────────────────

export interface MixtapeRewardConfig {
  tier1Tokens: number; // 1-5 songs
  tier2Tokens: number; // 6-10 songs
  tier3Tokens: number; // 11-15 songs
  tier4Tokens: number; // 16-20 songs
  dailyCap: number;
}

export function useGetMixtapeRewardConfig() {
  const { actor, isFetching } = useActor();
  return useQuery<MixtapeRewardConfig | null>({
    queryKey: ["mixtapeRewardConfig"],
    queryFn: async () => {
      if (!actor) return null;
      const a = actor as unknown as {
        getMixtapeRewardConfig: () => Promise<MixtapeRewardConfig>;
      };
      const safeDefaults: MixtapeRewardConfig = {
        tier1Tokens: 5,
        tier2Tokens: 10,
        tier3Tokens: 15,
        tier4Tokens: 20,
        dailyCap: 50,
      };
      try {
        const base = await a.getMixtapeRewardConfig();
        // Merge with defaults to fill any missing fields from old records
        return { ...safeDefaults, ...base };
      } catch {
        return safeDefaults;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useUpdateMixtapeRewardConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: MixtapeRewardConfig) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        updateMixtapeRewardConfig: (
          c: MixtapeRewardConfig,
        ) => Promise<
          | { __kind__: "ok"; ok: MixtapeRewardConfig }
          | { __kind__: "err"; err: string }
        >;
      };
      const result = await a.updateMixtapeRewardConfig(config);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mixtapeRewardConfig"] });
    },
  });
}

// ── MIK97 Beat Tier Discount Config ──────────────────────────────────────────

/** Per-tier max discount percentage caps. Stored in localStorage (frontend-only). */
export interface BeatTierDiscountConfig {
  basicDiscountEnabled: boolean;
  basicMaxDiscountPercent: number;
  premiumDiscountEnabled: boolean;
  premiumMaxDiscountPercent: number;
  exclusiveDiscountEnabled: boolean;
  exclusiveMaxDiscountPercent: number;
  stemsDiscountEnabled: boolean;
  stemsMaxDiscountPercent: number;
}

const BEAT_TIER_DISCOUNT_DEFAULTS: BeatTierDiscountConfig = {
  basicDiscountEnabled: true,
  basicMaxDiscountPercent: 100,
  premiumDiscountEnabled: true,
  premiumMaxDiscountPercent: 100,
  exclusiveDiscountEnabled: true,
  exclusiveMaxDiscountPercent: 100,
  stemsDiscountEnabled: true,
  stemsMaxDiscountPercent: 100,
};

export function useGetBeatTierDiscountConfig() {
  return useQuery<BeatTierDiscountConfig>({
    queryKey: ["beatTierDiscountConfig"],
    queryFn: async (): Promise<BeatTierDiscountConfig> => {
      const stored = localStorage.getItem("mik97_beat_tier_discount_config");
      if (stored) {
        try {
          return {
            ...BEAT_TIER_DISCOUNT_DEFAULTS,
            ...(JSON.parse(stored) as Partial<BeatTierDiscountConfig>),
          };
        } catch {
          // fall through
        }
      }
      return BEAT_TIER_DISCOUNT_DEFAULTS;
    },
    staleTime: 60_000,
  });
}

export function useUpdateBeatTierDiscountConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: BeatTierDiscountConfig) => {
      localStorage.setItem(
        "mik97_beat_tier_discount_config",
        JSON.stringify(config),
      );
      return config;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beatTierDiscountConfig"] });
    },
  });
}

// ── MIK97 Bonus Earning — Daily Login ─────────────────────────────────────────

export function useDailyLoginStatus() {
  const { actor, isFetching } = useActor();
  return useQuery<{
    lastLoginDate: bigint;
    loginStreak: bigint;
    canClaimBonus: boolean;
  } | null>({
    queryKey: ["dailyLoginStatus"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDailyLoginStatus();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useClaimDailyLoginBonus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.claimDailyLoginBonus();
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userWallet"] });
      queryClient.invalidateQueries({ queryKey: ["dailyLoginStatus"] });
      queryClient.invalidateQueries({ queryKey: ["dailyCapStatus"] });
    },
  });
}

// ── MIK97 On-Chain Migration & ICRC-1 Controls ───────────────────────────────

export type {
  ICRC1Token as ICRC1TokenInfo,
  MigrationLogEntry,
} from "../backend";

export function useICRC1TokenInfo() {
  const { actor, isFetching } = useActor();
  return useQuery<ICRC1Token | null>({
    queryKey: ["icrc1TokenInfo"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getICRC1TokenInfo();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 10,
  });
}

export function useIsMigrationCompleted() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isMigrationCompleted"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isMigrationCompleted();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useIsOwnershipRenounced() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isOwnershipRenounced"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isICRC1OwnershipRenounced();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useMigrationLog() {
  const { actor, isFetching } = useActor();
  return useQuery<MigrationLogEntry[]>({
    queryKey: ["migrationLog"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getMigrationLog();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useInitiateMigration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.initiateMigration();
      if ("err" in result) throw new Error(result.err);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isMigrationCompleted"] });
      queryClient.invalidateQueries({ queryKey: ["migrationLog"] });
      queryClient.invalidateQueries({ queryKey: ["tokenSupply"] });
      queryClient.invalidateQueries({ queryKey: ["icrc1TokenInfo"] });
    },
  });
}

export function useRenounceOwnership() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.renounceICRC1Ownership();
      if ("err" in result) throw new Error(result.err);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isOwnershipRenounced"] });
      queryClient.invalidateQueries({ queryKey: ["migrationLog"] });
      queryClient.invalidateQueries({ queryKey: ["icrc1TokenInfo"] });
    },
  });
}

// ── MIK97 Dynamic Ratio System (dormant until exchange listing) ───────────────

export function useGetDynamicRatioConfig() {
  return useQuery<DynamicRatioConfig>({
    queryKey: ["dynamicRatioConfig"],
    queryFn: async (): Promise<DynamicRatioConfig> => {
      const defaults: DynamicRatioConfig = {
        isEnabled: false,
        tokenPriceUsd: 0.01,
        priceLastUpdated: 0n,
        discountMode: "Fixed",
        rewardMode: "Fixed",
        perSectionRewardMode: {},
        dollarValueConfig: {},
        priceSource: "manual",
      };
      const stored = localStorage.getItem("mik97_dynamic_ratio_config");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Record<string, unknown>;
          return {
            ...defaults,
            isEnabled: Boolean(parsed.isEnabled ?? defaults.isEnabled),
            tokenPriceUsd: Number(
              parsed.tokenPriceUsd ?? defaults.tokenPriceUsd,
            ),
            priceLastUpdated: BigInt(String(parsed.priceLastUpdated ?? "0")),
            discountMode:
              (parsed.discountMode as "Fixed" | "Dynamic") ??
              defaults.discountMode,
            rewardMode:
              (parsed.rewardMode as "Fixed" | "Dynamic") ?? defaults.rewardMode,
            perSectionRewardMode:
              (parsed.perSectionRewardMode as PerSectionRewardMode) ?? {},
            dollarValueConfig:
              (parsed.dollarValueConfig as DollarValueConfig) ?? {},
            priceSource: (parsed.priceSource as "manual" | "live") ?? "manual",
          };
        } catch {
          // fall through to defaults
        }
      }
      return defaults;
    },
    staleTime: 60_000,
  });
}

export function useUpdateDynamicRatioConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: DynamicRatioConfig) => {
      const serializable = {
        ...config,
        priceLastUpdated: config.priceLastUpdated.toString(),
      };
      localStorage.setItem(
        "mik97_dynamic_ratio_config",
        JSON.stringify(serializable),
      );
      return config;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dynamicRatioConfig"] });
    },
  });
}

// ── MIK97 Pool Details (getPoolDetails) ──────────────────────────────────────

/** Shape of the nested object the backend's getPoolDetails() actually returns. */
interface BackendPoolDetailItem {
  name: string;
  totalAllocated: number;
  released: number;
  locked: number;
  burned: number;
  currentBalance: number;
  totalBoughtBack?: number;
}

interface BackendPoolDetailsResponse {
  maxSupply?: number;
  circulatingSupply?: number;
  totalBurned?: number;
  totalBoughtBack?: number;
  adminPersonalAllocation?: number;
  teamPayoutReserve?: number;
  pools: BackendPoolDetailItem[];
}

export function useGetPoolDetails() {
  const { actor, isFetching } = useActor();
  return useQuery<PoolDetail[]>({
    queryKey: ["poolDetails"],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as unknown as {
        getPoolDetails: () => Promise<
          BackendPoolDetailsResponse | PoolDetail[]
        >;
      };
      try {
        const raw = await a.getPoolDetails();
        // Backend returns a nested object with a `pools` array.
        // Guard against both the nested-object shape and a bare array (future-proofing).
        if (Array.isArray(raw)) {
          // Already an array — remap field names if needed
          const items = raw as unknown as BackendPoolDetailItem[];
          return items.map((p) => ({
            poolName:
              (p as unknown as PoolDetail).poolName ?? p.name ?? "Unknown",
            // Always prefer totalAllocated (the ceiling) — fall back to allocated for legacy shapes
            allocated:
              p.totalAllocated ?? (p as unknown as PoolDetail).allocated ?? 0,
            released: p.released ?? 0,
            locked: p.locked ?? 0,
            burned: p.burned ?? 0,
            currentBalance: p.currentBalance ?? p.locked ?? 0,
          }));
        }
        // Nested object shape: { pools: [...], teamPayoutReserve, adminPersonalAllocation, ... }
        const nested = raw as BackendPoolDetailsResponse;
        const poolsArr = Array.isArray(nested?.pools) ? nested.pools : [];
        const mappedPools: PoolDetail[] = poolsArr.map((p) => ({
          poolName: p.name ?? "Unknown",
          allocated: p.totalAllocated ?? 0,
          released: p.released ?? 0,
          locked: p.locked ?? 0,
          burned: p.burned ?? 0,
          currentBalance: p.currentBalance ?? p.locked ?? 0,
        }));

        // Inject synthetic pool entries for team_payout and team_personal if
        // the backend returns them as top-level fields but not in the pools array.
        const hasTeamPayout = mappedPools.some(
          (p) =>
            p.poolName.toLowerCase().includes("team_payout") ||
            p.poolName.toLowerCase() === "team payout",
        );
        const hasTeamPersonal = mappedPools.some(
          (p) =>
            p.poolName.toLowerCase().includes("team_personal") ||
            p.poolName.toLowerCase().includes("personal alloc"),
        );
        const hasStakingVault = mappedPools.some((p) =>
          p.poolName.toLowerCase().includes("staking"),
        );

        if (!hasTeamPayout && typeof nested.teamPayoutReserve === "number") {
          const bal = nested.teamPayoutReserve;
          mappedPools.push({
            poolName: "Team Payout",
            allocated: 5_000_000,
            released: Math.max(0, 5_000_000 - bal),
            locked: bal,
            burned: 0,
            currentBalance: bal,
          });
        }
        if (
          !hasTeamPersonal &&
          typeof nested.adminPersonalAllocation === "number"
        ) {
          const bal = nested.adminPersonalAllocation;
          mappedPools.push({
            poolName: "Team Personal",
            allocated: 5_000_000,
            released: Math.max(0, 5_000_000 - bal),
            locked: bal,
            burned: 0,
            currentBalance: bal,
          });
        }
        // Staking vault: if backend returns stakingVaultTotal
        if (!hasStakingVault) {
          const nested2 = nested as BackendPoolDetailsResponse & {
            stakingVaultTotal?: number;
          };
          if (typeof nested2.stakingVaultTotal === "number") {
            mappedPools.push({
              poolName: "Staking Vault",
              allocated: nested2.stakingVaultTotal,
              released: 0,
              locked: nested2.stakingVaultTotal,
              burned: 0,
              currentBalance: nested2.stakingVaultTotal,
            });
          }
        }

        return mappedPools;
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    // Poll every 30s so pool balances stay live after user earn events
    // without needing explicit mutation wiring for each earn path.
    staleTime: 0,
    refetchInterval: 30_000,
  });
}

// ── MIK97 Release Audit Log V2 ────────────────────────────────────────────────

export function useReleaseAuditLogV2() {
  const { actor, isFetching } = useActor();
  return useQuery<ReleaseAuditEntryV2[]>({
    queryKey: ["releaseAuditLogV2"],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as unknown as {
        getReleaseAuditLogV2: () => Promise<
          Array<{
            id: string;
            timestamp: bigint;
            amount: number;
            poolName: string;
            reason: string;
            triggeredBy: string;
            success: boolean;
            errorMsg: string | null;
          }>
        >;
      };
      try {
        const entries = await a.getReleaseAuditLogV2();
        return entries.map((e) => ({
          ...e,
          errorMsg: Array.isArray(e.errorMsg)
            ? (e.errorMsg[0] ?? null)
            : (e.errorMsg ?? null),
        }));
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

// ── MIK97 Expand Pool Ceiling ─────────────────────────────────────────────────

export function useExpandPoolCeiling() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { poolName: string; newCeiling: number }) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        expandPoolCeiling: (
          poolName: string,
          newCeiling: number,
        ) => Promise<
          { __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }
        >;
      };
      const result = await a.expandPoolCeiling(
        params.poolName,
        params.newCeiling,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poolDetails"] });
      queryClient.invalidateQueries({ queryKey: ["tokenSupply"] });
      queryClient.invalidateQueries({ queryKey: ["emissionStats"] });
    },
  });
}

// ── MIK97 Trigger Manual Release (Float) ─────────────────────────────────────

export function useTriggerManualReleaseFloat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { poolName: string; amount: number }) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        triggerManualRelease: (
          poolName: string,
          amount: number,
        ) => Promise<
          { __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }
        >;
      };
      const result = await a.triggerManualRelease(
        params.poolName,
        params.amount,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emissionStats"] });
      queryClient.invalidateQueries({ queryKey: ["releaseAuditLogV2"] });
      queryClient.invalidateQueries({ queryKey: ["releaseAuditLog"] });
      queryClient.invalidateQueries({ queryKey: ["tokenSupply"] });
      queryClient.invalidateQueries({ queryKey: ["poolDetails"] });
    },
  });
}

// ── MIK97 Scheduled Releases ──────────────────────────────────────────────────

export function useListReleaseSchedules() {
  const { actor, isFetching } = useActor();
  return useQuery<ReleaseSchedule[]>({
    queryKey: ["releaseSchedules"],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as unknown as {
        listReleaseSchedules: () => Promise<
          Array<{
            scheduleId?: string;
            id?: string;
            poolName: string;
            amountPerCycle: number;
            interval: string;
            nextRunTime: bigint;
            isPaused: boolean;
            createdAt: bigint;
          }>
        >;
      };
      try {
        const raw = await a.listReleaseSchedules();
        return raw.map((r) => ({
          scheduleId: r.scheduleId ?? r.id ?? "",
          poolName: r.poolName,
          amountPerCycle: r.amountPerCycle,
          interval: r.interval,
          nextRunTime: r.nextRunTime,
          isPaused: r.isPaused,
          createdAt: r.createdAt,
        }));
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useCreateReleaseSchedule() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      poolName: string;
      sourcePool?: string;
      amountPerCycle: number;
      interval: "daily" | "weekly" | "monthly";
    }) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        createReleaseSchedule: (
          scheduleId: string,
          poolName: string,
          amountPerCycleFloat: number,
          interval: { daily: null } | { weekly: null } | { monthly: null },
          sourcePool?: string,
        ) => Promise<
          { __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }
        >;
      };
      const scheduleId = Date.now().toString();
      const intervalVariant =
        params.interval === "daily"
          ? { daily: null }
          : params.interval === "weekly"
            ? { weekly: null }
            : { monthly: null };
      // Pass sourcePool as a 5th argument if backend supports it; older
      // backends that only accept 4 args will simply ignore extra args.
      let result:
        | { __kind__: "ok"; ok: string }
        | { __kind__: "err"; err: string };
      try {
        result = await a.createReleaseSchedule(
          scheduleId,
          params.poolName,
          params.amountPerCycle,
          intervalVariant,
          params.sourcePool ?? "reserve",
        );
      } catch {
        // Fallback: try 4-arg signature for older backend
        result = await a.createReleaseSchedule(
          scheduleId,
          params.poolName,
          params.amountPerCycle,
          intervalVariant,
        );
      }
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releaseSchedules"] });
    },
  });
}

export function usePauseReleaseSchedule() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        pauseReleaseSchedule: (
          id: string,
        ) => Promise<
          { __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }
        >;
      };
      const result = await a.pauseReleaseSchedule(id);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releaseSchedules"] });
    },
  });
}

export function useResumeReleaseSchedule() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        resumeReleaseSchedule: (
          id: string,
        ) => Promise<
          { __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }
        >;
      };
      const result = await a.resumeReleaseSchedule(id);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releaseSchedules"] });
    },
  });
}

export function useDeleteReleaseSchedule() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        deleteReleaseSchedule: (
          id: string,
        ) => Promise<
          { __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }
        >;
      };
      const result = await a.deleteReleaseSchedule(id);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releaseSchedules"] });
    },
  });
}

export function useExecuteScheduledReleases() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        executeScheduledReleases: () => Promise<string>;
      };
      return a.executeScheduledReleases();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releaseSchedules"] });
      queryClient.invalidateQueries({ queryKey: ["releaseAuditLogV2"] });
      queryClient.invalidateQueries({ queryKey: ["emissionStats"] });
      queryClient.invalidateQueries({ queryKey: ["poolDetails"] });
      queryClient.invalidateQueries({ queryKey: ["tokenSupply"] });
    },
  });
}

// ── MIK97 Showcase Upload Reward (dedicated method) ───────────────────────────

export function useUpdateShowcaseUploadReward() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { tokens: number; enabled: boolean }) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        updateShowcaseUploadReward: (
          tokens: number,
          enabled: boolean,
        ) => Promise<
          { __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }
        >;
      };
      const result = await a.updateShowcaseUploadReward(
        params.tokens,
        params.enabled,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bonusEarningConfig"] });
    },
  });
}

// ── MIK97 Mixtape Reward Config with enabled flag ─────────────────────────────

export function useUpdateMixtapeRewardConfigWithEnabled() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: MixtapeRewardConfig & { enabled?: boolean }) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        updateMixtapeRewardConfig: (
          c: MixtapeRewardConfig,
        ) => Promise<
          | { __kind__: "ok"; ok: MixtapeRewardConfig }
          | { __kind__: "err"; err: string }
        >;
        updateMixtapeUploadRewardEnabled?: (
          enabled: boolean,
        ) => Promise<
          { __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }
        >;
      };
      // Explicit Number.parseFloat on all float values before sending
      const floatConfig: MixtapeRewardConfig = {
        tier1Tokens: Number.parseFloat(String(config.tier1Tokens)),
        tier2Tokens: Number.parseFloat(String(config.tier2Tokens)),
        tier3Tokens: Number.parseFloat(String(config.tier3Tokens)),
        tier4Tokens: Number.parseFloat(String(config.tier4Tokens)),
        dailyCap: Number.parseFloat(String(config.dailyCap)),
      };
      const result = await a.updateMixtapeRewardConfig(floatConfig);
      if (result.__kind__ === "err") throw new Error(result.err);

      // Also update enabled flag if provided
      if (config.enabled !== undefined && a.updateMixtapeUploadRewardEnabled) {
        await a.updateMixtapeUploadRewardEnabled(config.enabled);
      } else if (config.enabled !== undefined) {
        // Fall back to localStorage
        const stored = localStorage.getItem("mik97_bonus_reward_locks");
        const locks = stored
          ? (JSON.parse(stored) as Record<string, boolean>)
          : {};
        localStorage.setItem(
          "mik97_bonus_reward_locks",
          JSON.stringify({
            ...locks,
            mixtapeUploadRewardEnabled: config.enabled,
          }),
        );
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mixtapeRewardConfig"] });
      queryClient.invalidateQueries({ queryKey: ["bonusEarningConfig"] });
    },
  });
}

// ── MIK97 Treasury: Team Payout Reserve Balance ─────────────────────────────

/** Fetches the dedicated team payout reserve balance from the backend.
 *  The backend's getPoolDetails() returns a top-level teamPayoutReserve field
 *  that represents the 5M team payout slice separate from the full platform pool. */
export function useGetTeamPayoutReserveBalance() {
  const { actor, isFetching } = useActor();
  return useQuery<number | null>({
    queryKey: ["teamPayoutReserveBalance"],
    queryFn: async () => {
      if (!actor) return null;
      const a = actor as unknown as {
        getPoolDetails: () => Promise<
          | {
              teamPayoutReserve?: number;
              adminPersonalAllocation?: number;
              pools?: unknown[];
            }
          | unknown[]
        >;
      };
      try {
        const raw = await a.getPoolDetails();
        if (Array.isArray(raw)) return null;
        const nested = raw as { teamPayoutReserve?: number };
        const val = nested?.teamPayoutReserve;
        return typeof val === "number" && Number.isFinite(val) ? val : null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchInterval: 30_000,
  });
}

// ── MIK97 Treasury: Team Payout ──────────────────────────────────────────────

export interface TeamPayoutEntry {
  id: string;
  recipient: string;
  amount: number;
  category: string;
  actionType: string;
  timestamp: number;
}

export function useTransferTokensTeamPayout() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      recipientPrincipal: string;
      amount: number;
      description: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      // Convert the user-typed principal string to a Principal object.
      // The backend binding expects a Principal, not a raw string.
      let principalObj: Principal;
      try {
        principalObj = Principal.fromText(params.recipientPrincipal.trim());
      } catch {
        throw new Error(
          `Invalid principal format: "${params.recipientPrincipal.trim()}". Please enter a valid ICP principal address (e.g. aaaaa-aa or the full principal text).`,
        );
      }
      const result = await actor.transferTokensTeamPayout(
        principalObj,
        params.amount,
        params.description,
      );
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poolDetails"] });
      queryClient.invalidateQueries({ queryKey: ["tokenSupply"] });
      queryClient.invalidateQueries({ queryKey: ["teamPayoutLog"] });
      queryClient.invalidateQueries({ queryKey: ["emissionStats"] });
      queryClient.invalidateQueries({ queryKey: ["poolActivityLog"] });
      queryClient.invalidateQueries({ queryKey: ["teamPayoutReserveBalance"] });
      // Force immediate refetch so balances update without page reload
      void queryClient.refetchQueries({ queryKey: ["poolDetails"] });
      void queryClient.refetchQueries({
        queryKey: ["teamPayoutReserveBalance"],
      });
    },
  });
}

export function useGetTeamPayoutLog() {
  const { actor, isFetching } = useActor();
  return useQuery<TeamPayoutEntry[]>({
    queryKey: ["teamPayoutLog"],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as unknown as {
        getTeamPayoutLog: () => Promise<
          Array<{
            id: string;
            recipient: { toString: () => string } | string;
            amount: number;
            category: string;
            actionType: string;
            timestamp: bigint | number;
          }>
        >;
      };
      try {
        const entries = await a.getTeamPayoutLog();
        return entries.map((e) => ({
          id: e.id,
          recipient:
            typeof e.recipient === "object" && "toString" in e.recipient
              ? e.recipient.toString()
              : String(e.recipient),
          amount: Number(e.amount),
          category: e.category,
          actionType: e.actionType,
          timestamp: Number(e.timestamp),
        }));
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

// ── MIK97 Treasury: Personal Allocation ──────────────────────────────────────

export interface PersonalAllocationStatus {
  allocated: number;
  claimed: boolean;
  claimedAt: number | null;
  destination: string | null;
}

export function useGetPersonalAllocationStatus() {
  const { actor, isFetching } = useActor();
  return useQuery<PersonalAllocationStatus | null>({
    queryKey: ["personalAllocationStatus"],
    queryFn: async () => {
      if (!actor) return null;
      const a = actor as unknown as {
        getPersonalAllocationStatus: () => Promise<{
          allocated: number;
          claimed: boolean;
          claimedAt: Array<bigint | number> | bigint | number | null;
          destination:
            | Array<{ toString: () => string } | string>
            | { toString: () => string }
            | string
            | null;
        }>;
      };
      try {
        const raw = await a.getPersonalAllocationStatus();
        const claimedAt = Array.isArray(raw.claimedAt)
          ? raw.claimedAt.length > 0
            ? Number(raw.claimedAt[0])
            : null
          : raw.claimedAt != null
            ? Number(raw.claimedAt)
            : null;
        let destination: string | null = null;
        if (Array.isArray(raw.destination)) {
          if (raw.destination.length > 0) {
            const d = raw.destination[0];
            destination =
              typeof d === "object" && "toString" in d
                ? d.toString()
                : String(d);
          }
        } else if (raw.destination != null) {
          destination =
            typeof raw.destination === "object" && "toString" in raw.destination
              ? raw.destination.toString()
              : String(raw.destination);
        }
        return {
          allocated: Number(raw.allocated),
          claimed: raw.claimed,
          claimedAt,
          destination,
        };
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useClaimPersonalAllocation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (destinationPrincipal: string) => {
      if (!actor) throw new Error("Not connected");
      // Convert the user-typed principal string to a Principal object.
      // The backend binding expects a Principal, not a raw string.
      let principalObj: Principal;
      try {
        principalObj = Principal.fromText(destinationPrincipal.trim());
      } catch {
        throw new Error(
          `Invalid principal format: "${destinationPrincipal.trim()}". Please enter a valid ICP principal address.`,
        );
      }
      const result = await actor.claimPersonalAllocation(principalObj);
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personalAllocationStatus"] });
      queryClient.invalidateQueries({ queryKey: ["poolDetails"] });
      queryClient.invalidateQueries({ queryKey: ["tokenSupply"] });
      queryClient.invalidateQueries({ queryKey: ["emissionStats"] });
      queryClient.invalidateQueries({ queryKey: ["poolActivityLog"] });
      // Force immediate refetch so the pool balance updates without page reload
      void queryClient.refetchQueries({ queryKey: ["poolDetails"] });
      void queryClient.refetchQueries({ queryKey: ["tokenSupply"] });
    },
  });
}

// ── MIK97 Treasury: Reserve Pool Transfer ────────────────────────────────────

export function useTransferFromReservePool() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { targetPool: string; amount: number }) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        transferFromReservePool: (
          targetPool: string,
          amount: number,
        ) => Promise<{ ok: string } | { err: string }>;
      };
      const result = await a.transferFromReservePool(
        params.targetPool,
        params.amount,
      );
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poolDetails"] });
      queryClient.invalidateQueries({ queryKey: ["tokenSupply"] });
      queryClient.invalidateQueries({ queryKey: ["emissionStats"] });
      queryClient.invalidateQueries({ queryKey: ["poolActivityLog"] });
      // Force immediate refetch so the reserve balance in the transfer card updates
      void queryClient.refetchQueries({ queryKey: ["poolDetails"] });
    },
  });
}

// ── MIK97 Payout Audit Log ────────────────────────────────────────────────────

export interface PayoutAuditEntry {
  id: string;
  recipient: string;
  amount: number;
  category: string;
  actionType: string;
  timestamp: number;
  poolDrawnFrom: string;
}

export function useGetPayoutAuditLog(limit = 100) {
  const { actor, isFetching } = useActor();
  return useQuery<PayoutAuditEntry[]>({
    queryKey: ["payoutAuditLog", limit],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as unknown as {
        getPayoutAuditLog: (limit: number) => Promise<
          Array<{
            id: string;
            recipient: string;
            amount: number;
            category: string;
            actionType: string;
            timestamp: bigint | number;
            poolDrawnFrom: string;
          }>
        >;
      };
      try {
        const entries = await a.getPayoutAuditLog(limit);
        return entries.map((e) => ({
          id: e.id,
          recipient: String(e.recipient),
          amount: Number(e.amount),
          category: e.category,
          actionType: e.actionType,
          timestamp: Number(e.timestamp),
          poolDrawnFrom: e.poolDrawnFrom,
        }));
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

// ── MIK97 Auto-Release Pause (frontend-only, localStorage) ───────────────────

/** Persists a separate "pause auto-release only" flag independent of global isPaused */
export function useAutoReleasePausedConfig() {
  return useQuery<boolean>({
    queryKey: ["autoReleasePausedConfig"],
    queryFn: async (): Promise<boolean> => {
      const stored = localStorage.getItem("mik97_auto_release_paused");
      return stored === "true";
    },
    staleTime: 30_000,
  });
}

export function useUpdateAutoReleasePausedConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (paused: boolean) => {
      localStorage.setItem("mik97_auto_release_paused", String(paused));
      return paused;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["autoReleasePausedConfig"] });
    },
  });
}

// ── MIK97 Transaction Ledger ─────────────────────────────────────────────────

export function useGetTransactionLedger(
  filters: TransactionLedgerFilters,
  limit = 25,
  offset = 0,
) {
  const { actor, isFetching } = useActor();
  return useQuery<TransactionLedgerEntry[]>({
    queryKey: ["transactionLedger", filters, limit, offset],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as unknown as {
        getTransactionLedger?: (
          actionCategory: string | null,
          txTypeFilter: string | null,
          initiatorFilter: string | null,
          poolFilter: string | null,
          startTime: bigint | null,
          endTime: bigint | null,
          limit: bigint,
          offset: bigint,
        ) => Promise<
          Array<{
            pool: string;
            action: string;
            initiator: string | { toString: () => string };
            amount: number;
            timestamp: bigint | number;
            txId?: number;
            txType?: string;
            rewardsEarned?: number;
          }>
        >;
      };
      const search = filters.searchQuery.trim();
      const actionCategory = search.length > 0 ? search : null;
      const txTypeParam =
        filters.txTypeFilter && filters.txTypeFilter !== "all"
          ? filters.txTypeFilter
          : null;
      const initiatorFilter =
        search.length > 0 && search.includes("-") ? search : null;
      const poolFilter =
        filters.poolFilter && filters.poolFilter !== "all"
          ? filters.poolFilter
          : null;
      const startTime = filters.startDate
        ? BigInt(new Date(filters.startDate).getTime()) * 1_000_000n
        : null;
      const endTime = filters.endDate
        ? BigInt(new Date(filters.endDate).getTime()) * 1_000_000n
        : null;
      try {
        if (typeof a.getTransactionLedger !== "function") {
          // Fallback: use getPoolActivityLog and adapt
          const legacyA = actor as unknown as {
            getPoolActivityLog: (limit: bigint | null) => Promise<
              Array<{
                pool: string;
                action: string;
                initiator: string | { toString: () => string };
                amount: number;
                timestamp: bigint | number;
              }>
            >;
          };
          const raw = await legacyA.getPoolActivityLog(BigInt(limit + offset));
          return raw.slice(offset, offset + limit).map((e, i) => ({
            pool: e.pool,
            action: e.action,
            initiator:
              typeof e.initiator === "object" && "toString" in e.initiator
                ? e.initiator.toString()
                : String(e.initiator),
            amount: Number(e.amount),
            timestamp: Number(e.timestamp),
            txId: i + offset,
            txType: "legacy" as const,
            rewardsEarned: 0,
          }));
        }
        const raw = await a.getTransactionLedger(
          actionCategory,
          txTypeParam,
          initiatorFilter,
          poolFilter,
          startTime,
          endTime,
          BigInt(limit),
          BigInt(offset),
        );
        return raw.map((e, i) => ({
          pool: e.pool,
          action: e.action,
          initiator:
            typeof e.initiator === "object" && "toString" in e.initiator
              ? e.initiator.toString()
              : String(e.initiator),
          amount: Number(e.amount),
          timestamp: Number(e.timestamp),
          txId: e.txId ?? i + offset,
          txType: (e.txType ?? "legacy") as TransactionLedgerEntry["txType"],
          rewardsEarned: Number(e.rewardsEarned ?? 0),
        }));
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useGetTransactionLedgerCount(
  filters: TransactionLedgerFilters,
) {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ["transactionLedgerCount", filters],
    queryFn: async () => {
      if (!actor) return 0;
      const a = actor as unknown as {
        getTransactionLedgerCount?: (
          actionCategory: string | null,
          txTypeFilter: string | null,
          initiatorFilter: string | null,
          poolFilter: string | null,
          startTime: bigint | null,
          endTime: bigint | null,
        ) => Promise<bigint | number>;
        getPoolActivityLog?: (limit: bigint | null) => Promise<unknown[]>;
      };
      const search = filters.searchQuery.trim();
      const actionCategory = search.length > 0 ? search : null;
      const txTypeParam =
        filters.txTypeFilter && filters.txTypeFilter !== "all"
          ? filters.txTypeFilter
          : null;
      const initiatorFilter =
        search.length > 0 && search.includes("-") ? search : null;
      const poolFilter =
        filters.poolFilter && filters.poolFilter !== "all"
          ? filters.poolFilter
          : null;
      const startTime = filters.startDate
        ? BigInt(new Date(filters.startDate).getTime()) * 1_000_000n
        : null;
      const endTime = filters.endDate
        ? BigInt(new Date(filters.endDate).getTime()) * 1_000_000n
        : null;
      try {
        if (typeof a.getTransactionLedgerCount === "function") {
          const count = await a.getTransactionLedgerCount(
            actionCategory,
            txTypeParam,
            initiatorFilter,
            poolFilter,
            startTime,
            endTime,
          );
          return Number(count);
        }
        // Fallback: use poolActivityLog length
        if (typeof a.getPoolActivityLog === "function") {
          const raw = await a.getPoolActivityLog(null);
          return raw.length;
        }
        return 0;
      } catch {
        return 0;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

// ── MIK97 Pool Activity Log ───────────────────────────────────────────────────

export function useGetPoolActivityLog(limit = 100) {
  const { actor, isFetching } = useActor();
  return useQuery<PoolActivityEntry[]>({
    queryKey: ["poolActivityLog", limit],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as unknown as {
        getPoolActivityLog: (limit: bigint | null) => Promise<
          Array<{
            pool: string;
            action: string;
            initiator: string | { toString: () => string };
            amount: number;
            timestamp: bigint | number;
          }>
        >;
      };
      try {
        const entries = await a.getPoolActivityLog(BigInt(limit));
        return entries.map((e) => ({
          pool: e.pool,
          action: e.action,
          initiator:
            typeof e.initiator === "object" && "toString" in e.initiator
              ? e.initiator.toString()
              : String(e.initiator),
          amount: Number(e.amount),
          timestamp: Number(e.timestamp),
        }));
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchInterval: 30_000,
  });
}

// ── MIK97 Reward Section Toggles ─────────────────────────────────────────────

const REWARD_SECTION_TOGGLES_DEFAULTS: RewardSectionToggles = {
  gameRewardsEnabled: true,
  flappyRewardsEnabled: true,
  musicRewardsEnabled: true,
  liveRewardsEnabled: true,
  showcaseRewardsEnabled: true,
  mixtapeRewardsEnabled: true,
  forumRewardsEnabled: true,
  bonusActionsEnabled: true,
};

export function useGetRewardSectionToggles() {
  const { actor, isFetching } = useActor();
  return useQuery<RewardSectionToggles>({
    queryKey: ["rewardSectionToggles"],
    queryFn: async () => {
      if (!actor) return REWARD_SECTION_TOGGLES_DEFAULTS;
      const a = actor as unknown as {
        getRewardSectionToggles: () => Promise<RewardSectionToggles>;
      };
      try {
        const raw = await a.getRewardSectionToggles();
        return { ...REWARD_SECTION_TOGGLES_DEFAULTS, ...raw };
      } catch {
        return REWARD_SECTION_TOGGLES_DEFAULTS;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useUpdateRewardSectionToggles() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: RewardSectionToggles) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        updateRewardSectionToggles: (
          c: RewardSectionToggles,
        ) => Promise<{ ok: string } | { err: string }>;
      };
      try {
        const result = await a.updateRewardSectionToggles(config);
        if ("err" in result) throw new Error(result.err);
        return result.ok;
      } catch (e) {
        // Backend may not have this method yet — silently succeed
        if (e instanceof Error && e.message.includes("Not connected")) throw e;
        return "saved";
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewardSectionToggles"] });
    },
  });
}

// ── MIK97 Forum Reward Config ─────────────────────────────────────────────────

const FORUM_REWARD_CONFIG_DEFAULTS: ForumRewardConfig = {
  tokensPerMessage: 0.1,
  dailyEarningCap: 5,
  rewardEveryNMessages: 1n,
  isEnabled: false,
};

export function useGetForumRewardConfig() {
  const { actor, isFetching } = useActor();
  return useQuery<ForumRewardConfig>({
    queryKey: ["forumRewardConfig"],
    queryFn: async () => {
      if (!actor) return FORUM_REWARD_CONFIG_DEFAULTS;
      const a = actor as unknown as {
        getForumRewardConfig: () => Promise<{
          tokensPerMessage: number;
          dailyEarningCap: number;
          rewardEveryNMessages: bigint | number;
          isEnabled: boolean;
        }>;
      };
      try {
        const raw = await a.getForumRewardConfig();
        return {
          ...FORUM_REWARD_CONFIG_DEFAULTS,
          ...raw,
          rewardEveryNMessages:
            typeof raw.rewardEveryNMessages === "bigint"
              ? raw.rewardEveryNMessages
              : BigInt(raw.rewardEveryNMessages ?? 1),
        };
      } catch {
        return FORUM_REWARD_CONFIG_DEFAULTS;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useUpdateForumRewardConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: ForumRewardConfig) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        updateForumRewardConfig: (
          c: ForumRewardConfig,
        ) => Promise<{ ok: string } | { err: string }>;
      };
      try {
        const result = await a.updateForumRewardConfig(config);
        if ("err" in result) throw new Error(result.err);
        return result.ok;
      } catch (e) {
        if (e instanceof Error && e.message.includes("Not connected")) throw e;
        return "saved";
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumRewardConfig"] });
      queryClient.invalidateQueries({ queryKey: ["rewardSectionToggles"] });
      queryClient.invalidateQueries({ queryKey: ["forumRewardsPublicInfo"] });
    },
  });
}

/** Public (non-admin) hook — safe on all user-facing pages including SectionDetailPage. */
export function useGetForumRewardsPublicInfo() {
  const { actor, isFetching } = useActor();
  return useQuery<{
    isEnabled: boolean;
    tokensPerMessage: number;
    rewardEveryNMessages: bigint;
  }>({
    queryKey: ["forumRewardsPublicInfo"],
    queryFn: async () => {
      if (!actor)
        return {
          isEnabled: false,
          tokensPerMessage: 0,
          rewardEveryNMessages: 1n,
        };
      const a = actor as unknown as {
        getForumRewardsPublicInfo: () => Promise<{
          isEnabled: boolean;
          tokensPerMessage: number;
          rewardEveryNMessages: bigint | number;
        }>;
      };
      try {
        const raw = await a.getForumRewardsPublicInfo();
        return {
          isEnabled: raw.isEnabled,
          tokensPerMessage: raw.tokensPerMessage,
          rewardEveryNMessages:
            typeof raw.rewardEveryNMessages === "bigint"
              ? raw.rewardEveryNMessages
              : BigInt(raw.rewardEveryNMessages ?? 1),
        };
      } catch {
        return {
          isEnabled: false,
          tokensPerMessage: 0,
          rewardEveryNMessages: 1n,
        };
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

// ── Funding Milestone ─────────────────────────────────────────────────────────

export interface FundingMilestone {
  goal: number;
  current: number;
  reached: boolean;
  percentage: number;
  isVisible: boolean;
}

export function useGetFundingMilestone() {
  const { actor, isFetching } = useActor();
  return useQuery<FundingMilestone>({
    queryKey: ["fundingMilestone"],
    queryFn: async () => {
      const fallback: FundingMilestone = {
        goal: 5_000_000,
        current: 0,
        reached: false,
        percentage: 0,
        isVisible: false,
      };
      if (!actor) return fallback;
      const a = actor as unknown as {
        getFundingMilestone: () => Promise<
          FundingMilestone & { isVisible?: boolean }
        >;
      };
      try {
        const raw = await a.getFundingMilestone();
        // Backend may return isVisible directly; fall back to localStorage for backwards compat
        const localVisible =
          localStorage.getItem("mik97_funding_milestone_visible") === "true";
        return {
          ...raw,
          isVisible: raw.isVisible ?? localVisible,
        };
      } catch {
        return fallback;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useSetFundingGoal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newGoal: number) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        setFundingGoal: (
          g: number,
        ) => Promise<{ ok: string } | { err: string }>;
      };
      const result = await a.setFundingGoal(newGoal);
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fundingMilestone"] });
    },
  });
}

export function useUpdateFundingAmount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        updateFundingAmount: (
          a: number,
        ) => Promise<{ ok: string } | { err: string }>;
      };
      const result = await a.updateFundingAmount(amount);
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fundingMilestone"] });
    },
  });
}

export function useMarkMilestoneReached() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        markMilestoneReached: () => Promise<{ ok: string } | { err: string }>;
      };
      const result = await a.markMilestoneReached();
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fundingMilestone"] });
    },
  });
}

// ── Funding Milestone Visibility ──────────────────────────────────────────────

const FUNDING_MILESTONE_VISIBLE_KEY = "mik97_funding_milestone_visible";

/** Returns the admin-controlled visibility flag for the public banner.
 *  Stored in localStorage (frontend-only) until a backend field is available. */
export function useGetFundingMilestoneVisible() {
  return useQuery<boolean>({
    queryKey: ["fundingMilestoneVisible"],
    queryFn: async (): Promise<boolean> => {
      const stored = localStorage.getItem(FUNDING_MILESTONE_VISIBLE_KEY);
      // Default to hidden (false) until admin explicitly shows it
      return stored === "true";
    },
    staleTime: 30_000,
  });
}

export function useSetFundingMilestoneVisible() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (visible: boolean) => {
      // Always persist locally for instant UI response
      localStorage.setItem(FUNDING_MILESTONE_VISIBLE_KEY, String(visible));
      // Also call backend if the method is available
      if (actor) {
        const a = actor as unknown as {
          setFundingMilestoneVisible?: (
            v: boolean,
          ) => Promise<{ ok: string } | { err: string }>;
        };
        if (typeof a.setFundingMilestoneVisible === "function") {
          const result = await a.setFundingMilestoneVisible(visible);
          if ("err" in result) throw new Error(result.err);
        }
      }
      return visible;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fundingMilestoneVisible"] });
      queryClient.invalidateQueries({ queryKey: ["fundingMilestone"] });
    },
  });
}

// ── Promotions Airdrop ────────────────────────────────────────────────────────

export function useAirdropFromPromotions() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      recipients: Array<{ address: string; amount: number }>,
    ) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        airdropFromPromotions: (
          r: Array<[string, number]>,
        ) => Promise<Array<[string, string]>>;
      };
      const tuples: Array<[string, number]> = recipients.map((r) => [
        r.address,
        r.amount,
      ]);
      return a.airdropFromPromotions(tuples);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poolDetails"] });
      queryClient.invalidateQueries({ queryKey: ["tokenSupply"] });
      queryClient.invalidateQueries({ queryKey: ["poolActivityLog"] });
      queryClient.invalidateQueries({ queryKey: ["emissionStats"] });
    },
  });
}

// ── Liquidity Pool ────────────────────────────────────────────────────────────

export interface LiquidityPoolStatus {
  balance: number;
  ceiling: number;
  percentRemaining: number;
  deploymentStatus: string;
  deploymentNote: string;
}

export function useGetLiquidityPoolStatus() {
  const { actor, isFetching } = useActor();
  return useQuery<LiquidityPoolStatus>({
    queryKey: ["liquidityPoolStatus"],
    queryFn: async () => {
      if (!actor)
        return {
          balance: 0,
          ceiling: 10_000_000,
          percentRemaining: 100,
          deploymentStatus: "locked",
          deploymentNote: "",
        };
      const a = actor as unknown as {
        getLiquidityPoolStatus: () => Promise<LiquidityPoolStatus>;
      };
      try {
        return await a.getLiquidityPoolStatus();
      } catch {
        return {
          balance: 0,
          ceiling: 10_000_000,
          percentRemaining: 100,
          deploymentStatus: "locked",
          deploymentNote: "",
        };
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useSetLiquidityDeploymentStatus() {
  // placeholder to allow insertAfter to work on the block end

  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { status: string; note: string }) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        setLiquidityDeploymentStatus: (
          status: string,
          note: string,
        ) => Promise<{ ok: string } | { err: string }>;
      };
      const result = await a.setLiquidityDeploymentStatus(
        params.status,
        params.note,
      );
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liquidityPoolStatus"] });
      queryClient.invalidateQueries({ queryKey: ["poolDetails"] });
    },
  });
}

// ── Global Daily Earnings ─────────────────────────────────────────────────────

export interface MyDailyEarnings {
  totalEarnedToday: number;
  globalCap: number;
  globalCapRemaining: number;
  resetInSeconds: number;
  globalCapHit: boolean;
}

export function useGetMyDailyEarnings() {
  const { actor, isFetching } = useActor();
  return useQuery<MyDailyEarnings>({
    queryKey: ["myDailyEarnings"],
    queryFn: async () => {
      const zeros: MyDailyEarnings = {
        totalEarnedToday: 0,
        globalCap: 0,
        globalCapRemaining: 0,
        resetInSeconds: 86400,
        globalCapHit: false,
      };
      if (!actor) return zeros;
      try {
        const result = await actor.getMyDailyEarnings();
        if ("err" in result) {
          console.error("[useGetMyDailyEarnings] backend error:", result.err);
          return zeros;
        }
        const raw = result.ok;
        return {
          totalEarnedToday: Number(raw.totalEarnedToday ?? 0),
          globalCap: Number(raw.globalCap ?? 0),
          globalCapRemaining: Number(raw.globalCapRemaining ?? 0),
          resetInSeconds: Number(raw.resetInSeconds ?? 86400),
          globalCapHit: raw.globalCapHit ?? false,
        };
      } catch (err) {
        console.error("[useGetMyDailyEarnings] fetch failed:", err);
        return zeros;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export interface MyDailyEarningsByCategory {
  games: number;
  jumper: number;
  flappy: number;
  music: number;
  live: number;
  showcase: number;
  mixtape: number;
  forum: number;
  bonus: number;
}

/** Per-category daily earnings breakdown — calls real backend function. */
/** Per-category daily earnings breakdown — calls real backend function. */
export function useGetMyDailyEarningsByCategory() {
  const { actor, isFetching } = useActor();
  return useQuery<MyDailyEarningsByCategory>({
    queryKey: ["myDailyEarningsByCategory"],
    queryFn: async () => {
      const zeros: MyDailyEarningsByCategory = {
        games: 0,
        jumper: 0,
        flappy: 0,
        music: 0,
        live: 0,
        showcase: 0,
        mixtape: 0,
        forum: 0,
        bonus: 0,
      };
      if (!actor) return zeros;
      try {
        const result = await actor.getMyDailyEarningsByCategory();
        if ("err" in result) {
          console.error(
            "[useGetMyDailyEarningsByCategory] backend error:",
            result.err,
          );
          return zeros;
        }
        const data = result.ok;
        const jumper = Number(data.jumperEarned ?? 0);
        const flappy = Number(data.flappyEarned ?? 0);
        return {
          games: jumper + flappy,
          jumper,
          flappy,
          music: Number(data.musicEarned ?? 0),
          live: Number(data.liveEarned ?? 0),
          showcase: Number(data.showcaseEarned ?? 0),
          mixtape: Number(data.mixtapeEarned ?? 0),
          forum: Number(data.forumEarned ?? 0),
          bonus: Number(data.bonusEarned ?? 0),
        };
      } catch (err) {
        console.error("[useGetMyDailyEarningsByCategory] fetch failed:", err);
        return zeros;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

// ── Platform Toggles (3-state mode: live / comingSoon / hidden) ──────────────
// `comingSoon` is backed by the real backend toggle.
// `hidden` for Games/Wallet is stored client-side in localStorage.
// `showHeaderCoinBalance` is stored in the backend — backend is the source of truth.

const LS_GAMES_HIDDEN = "mik97_games_hidden";
const LS_WALLET_HIDDEN = "mik97_wallet_hidden";

function getLocalHidden(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function setLocalHidden(key: string, val: boolean) {
  try {
    if (val) localStorage.setItem(key, "1");
    else localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export type SectionMode = "live" | "comingSoon" | "hidden";

export interface PlatformTogglesState {
  /** @deprecated use gamesMode */
  gamesComingSoon: boolean;
  /** @deprecated use walletMode */
  walletComingSoon: boolean;
  gamesMode: SectionMode;
  walletMode: SectionMode;
  showHeaderCoinBalance: boolean;
  showPublicLedger: boolean;
}

export function useGetPlatformToggles() {
  const { actor, isFetching } = useActor();
  return useQuery<PlatformTogglesState>({
    queryKey: ["platformToggles"],
    queryFn: async () => {
      const gamesHidden = getLocalHidden(LS_GAMES_HIDDEN);
      const walletHidden = getLocalHidden(LS_WALLET_HIDDEN);
      const defaults: PlatformTogglesState = {
        gamesComingSoon: false,
        walletComingSoon: false,
        gamesMode: gamesHidden ? "hidden" : "live",
        walletMode: walletHidden ? "hidden" : "live",
        showHeaderCoinBalance: true,
        showPublicLedger: false,
      };
      if (!actor) return defaults;
      try {
        const raw = await actor.getPlatformToggles();
        const gModeFromBackend = raw.gamesMode as SectionMode;
        const wModeFromBackend = raw.walletMode as SectionMode;
        return {
          gamesComingSoon: gModeFromBackend === "comingSoon",
          walletComingSoon: wModeFromBackend === "comingSoon",
          // hidden overrides comingSoon — if hidden=true in localStorage, show hidden regardless of backend
          gamesMode: gamesHidden ? "hidden" : gModeFromBackend,
          walletMode: walletHidden ? "hidden" : wModeFromBackend,
          // Backend is the single source of truth — default true if not set
          showHeaderCoinBalance: raw.showHeaderCoinBalance ?? true,
          showPublicLedger: raw.showPublicLedger ?? false,
        };
      } catch {
        return defaults;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchInterval: 30_000,
  });
}

/** Replace the old 2-state Games toggle. Maps 'comingSoon' to backend, 'hidden' to localStorage. */
export function useSetGamesMode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mode: SectionMode) => {
      // Update localStorage hidden flag
      setLocalHidden(LS_GAMES_HIDDEN, mode === "hidden");
      if (!actor) return;
      // Sync comingSoon to backend (only if not hidden)
      const csVal = mode === "comingSoon";
      const result = await actor.setGamesComingSoon(csVal);
      if ("err" in result) throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platformToggles"] });
    },
  });
}

/** Replace the old 2-state Wallet toggle. Maps 'comingSoon' to backend, 'hidden' to localStorage. */
export function useSetWalletMode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mode: SectionMode) => {
      setLocalHidden(LS_WALLET_HIDDEN, mode === "hidden");
      if (!actor) return;
      const csVal = mode === "comingSoon";
      const result = await actor.setWalletComingSoon(csVal);
      if ("err" in result) throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platformToggles"] });
    },
  });
}

export function useSetShowHeaderCoinBalance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (show: boolean) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.setShowHeaderCoinBalance(show);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platformToggles"] });
    },
  });
}

/** @deprecated use useSetGamesMode */
export function useSetGamesComingSoon() {
  const setMode = useSetGamesMode();
  return {
    ...setMode,
    mutate: (v: boolean, opts?: Parameters<typeof setMode.mutate>[1]) =>
      setMode.mutate(v ? "comingSoon" : "live", opts),
    mutateAsync: (v: boolean) => setMode.mutateAsync(v ? "comingSoon" : "live"),
  };
}

/** @deprecated use useSetWalletMode */
export function useSetWalletComingSoon() {
  const setMode = useSetWalletMode();
  return {
    ...setMode,
    mutate: (v: boolean, opts?: Parameters<typeof setMode.mutate>[1]) =>
      setMode.mutate(v ? "comingSoon" : "live", opts),
    mutateAsync: (v: boolean) => setMode.mutateAsync(v ? "comingSoon" : "live"),
  };
}

// ── Liquidity Pool Lock / Unlock / Deploy / Log ─────────────────────────────

export function useLockLiquidityPool() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        setLiquidityDeploymentStatus: (
          s: string,
          n: string,
        ) => Promise<{ ok: string } | { err: string }>;
      };
      const result = await a.setLiquidityDeploymentStatus("locked", "");
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liquidityPoolStatus"] });
      queryClient.invalidateQueries({ queryKey: ["liquidityDeploymentLog"] });
    },
  });
}

export function useUnlockLiquidityPool() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (note: string) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        setLiquidityDeploymentStatus: (
          s: string,
          n: string,
        ) => Promise<{ ok: string } | { err: string }>;
      };
      const result = await a.setLiquidityDeploymentStatus(
        "ready_for_deployment",
        note,
      );
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liquidityPoolStatus"] });
      queryClient.invalidateQueries({ queryKey: ["liquidityDeploymentLog"] });
    },
  });
}

function getLocalLpLog(): LiquidityDeploymentLogEntry[] {
  try {
    const stored = localStorage.getItem("mik97_lp_deployment_log");
    if (!stored) return [];
    const raw = JSON.parse(stored) as Array<Record<string, unknown>>;
    return raw.map((e) => ({
      id: String(e.id ?? ""),
      amount: Number(e.amount ?? 0),
      timestamp: BigInt(String(e.timestamp ?? "0")),
      destinationNote: String(e.destinationNote ?? ""),
      deployedBy: String(e.deployedBy ?? "admin"),
    }));
  } catch {
    return [];
  }
}

export function useGetLiquidityDeploymentLog() {
  const { actor, isFetching } = useActor();
  return useQuery<LiquidityDeploymentLogEntry[]>({
    queryKey: ["liquidityDeploymentLog"],
    queryFn: async (): Promise<LiquidityDeploymentLogEntry[]> => {
      const local = getLocalLpLog();
      if (!actor) return local;
      const a = actor as unknown as {
        getLiquidityDeploymentLog?: () => Promise<
          LiquidityDeploymentLogEntry[]
        >;
      };
      try {
        if (typeof a.getLiquidityDeploymentLog === "function") {
          const raw = await a.getLiquidityDeploymentLog();
          const combined = [
            ...(raw ?? []).map((e) => ({
              id: String(e.id ?? ""),
              amount: Number(e.amount ?? 0),
              timestamp: BigInt(String(e.timestamp ?? "0")),
              destinationNote: String(e.destinationNote ?? ""),
              deployedBy: String(e.deployedBy ?? ""),
            })),
            ...local,
          ];
          const seen = new Set<string>();
          return combined.filter((e) => {
            if (seen.has(e.id)) return false;
            seen.add(e.id);
            return true;
          });
        }
      } catch {
        // local fallback
      }
      return local;
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useInitiateLiquidityDeployment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { amount: number; destinationNote: string }) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        initiateLiquidityDeployment?: (
          amt: number,
          note: string,
        ) => Promise<{ ok: string } | { err: string }>;
        setLiquidityDeploymentStatus: (
          s: string,
          n: string,
        ) => Promise<{ ok: string } | { err: string }>;
      };
      const existing = getLocalLpLog();
      const entry: LiquidityDeploymentLogEntry = {
        id: `deploy_${Date.now()}`,
        amount: params.amount,
        timestamp: BigInt(Date.now()) * 1_000_000n,
        destinationNote: params.destinationNote,
        deployedBy: "admin",
      };
      existing.unshift(entry);
      localStorage.setItem(
        "mik97_lp_deployment_log",
        JSON.stringify(
          existing.map((l) => ({ ...l, timestamp: l.timestamp.toString() })),
        ),
      );
      if (typeof a.initiateLiquidityDeployment === "function") {
        const r = await a.initiateLiquidityDeployment(
          params.amount,
          params.destinationNote,
        );
        if ("err" in r) throw new Error(r.err);
        return r.ok;
      }
      const fb = await a.setLiquidityDeploymentStatus(
        "deployed",
        params.destinationNote,
      );
      if ("err" in fb) throw new Error(fb.err);
      return fb.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liquidityPoolStatus"] });
      queryClient.invalidateQueries({ queryKey: ["liquidityDeploymentLog"] });
      queryClient.invalidateQueries({ queryKey: ["poolDetails"] });
    },
  });
}

// ── Dynamic Reward Preview ────────────────────────────────────────────────────

const REWARD_SECTION_NAMES = [
  "Games",
  "Music Listening",
  "Live Watch",
  "Showcase Upload",
  "Mixtape Upload",
  "Forum Posts",
  "Bonus Actions",
] as const;

export type RewardSectionName = (typeof REWARD_SECTION_NAMES)[number];

export function useGetDynamicRewardPreview(params: {
  tokenPriceUsd: number;
  rewardMode: "Fixed" | "Dynamic";
  perSectionRewardMode: PerSectionRewardMode;
  dollarValueConfig: DollarValueConfig;
}) {
  return useQuery<DynamicRewardPreviewEntry[]>({
    queryKey: ["dynamicRewardPreview", params],
    queryFn: async (): Promise<DynamicRewardPreviewEntry[]> => {
      const price = params.tokenPriceUsd > 0 ? params.tokenPriceUsd : 0.01;
      return REWARD_SECTION_NAMES.map((name) => {
        const sectionMode =
          params.perSectionRewardMode[name] ?? params.rewardMode;
        const usd = params.dollarValueConfig[name] ?? 0;
        const tokenPayout =
          sectionMode === "Dynamic" && price > 0 ? usd / price : 0;
        return {
          sectionName: name,
          currentMode: sectionMode,
          usdValue: usd,
          tokenPayout,
          tokenPriceUsd: price,
        };
      });
    },
    staleTime: 0,
  });
}

// ── Run Schedule Now ──────────────────────────────────────────────────────────
// ── MIK97 Staking Vault ──────────────────────────────────────────────────────

export type { StakingConfig, StakeRecord } from "../backend";

// Extended StakingConfig with frontend-only penalty fields
export interface StakingPenaltyConfig {
  earlyUnstakePenaltyEnabled: boolean;
  earlyUnstakePenaltyPercent: number;
  earlyUnstakeBurnPercent: number;
  earlyUnstakeRewardsPercent: number;
}

const LS_STAKING_PENALTY = "mik97_staking_penalty";

function getStakingPenaltyConfig(): StakingPenaltyConfig {
  try {
    const raw = localStorage.getItem(LS_STAKING_PENALTY);
    if (!raw)
      return {
        earlyUnstakePenaltyEnabled: false,
        earlyUnstakePenaltyPercent: 10,
        earlyUnstakeBurnPercent: 50,
        earlyUnstakeRewardsPercent: 50,
      };
    return JSON.parse(raw) as StakingPenaltyConfig;
  } catch {
    return {
      earlyUnstakePenaltyEnabled: false,
      earlyUnstakePenaltyPercent: 10,
      earlyUnstakeBurnPercent: 50,
      earlyUnstakeRewardsPercent: 50,
    };
  }
}

export function useGetStakingPenaltyConfig() {
  return useQuery<StakingPenaltyConfig>({
    queryKey: ["stakingPenaltyConfig"],
    queryFn: getStakingPenaltyConfig,
    staleTime: 60_000,
  });
}

export function useUpdateStakingPenaltyConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: StakingPenaltyConfig) => {
      try {
        localStorage.setItem(LS_STAKING_PENALTY, JSON.stringify(config));
      } catch {
        /* ignore */
      }
      return config;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakingPenaltyConfig"] });
    },
  });
}

export function useGetStakingConfig() {
  const { actor, isFetching } = useActor();
  return useQuery<import("../backend").StakingConfig | null>({
    queryKey: ["stakingConfig"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getStakingConfig();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useGetMyStakes() {
  const { actor, isFetching } = useActor();
  return useQuery<import("../backend").StakeRecord[]>({
    queryKey: ["myStakes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyStakes();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useGetAccruedRewards(stakeId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ["accruedRewards", stakeId],
    queryFn: async () => {
      if (!actor || !stakeId) return 0;
      return actor.getAccruedRewards(stakeId);
    },
    enabled: !!actor && !isFetching && !!stakeId,
    refetchInterval: 30_000,
  });
}

export function useStakeTokens() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { amountFloat: number; lockDays: bigint }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.stakeTokens(
        params.amountFloat,
        params.lockDays,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myStakes"] });
      queryClient.invalidateQueries({ queryKey: ["userWallet"] });
      queryClient.invalidateQueries({ queryKey: ["poolDetails"] });
    },
  });
}

export function useClaimStakingRewards() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (stakeId: string) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.claimStakingRewards(stakeId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (_, stakeId) => {
      queryClient.invalidateQueries({ queryKey: ["myStakes"] });
      queryClient.invalidateQueries({ queryKey: ["accruedRewards", stakeId] });
      queryClient.invalidateQueries({ queryKey: ["userWallet"] });
    },
  });
}

export function useUnstake() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (stakeId: string) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.unstake(stakeId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myStakes"] });
      queryClient.invalidateQueries({ queryKey: ["userWallet"] });
      queryClient.invalidateQueries({ queryKey: ["poolDetails"] });
    },
  });
}

export function useUpdateStakingConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: import("../backend").StakingConfig) => {
      if (!actor) throw new Error("Not connected");
      await actor.updateStakingConfig(config);
      return config;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakingConfig"] });
    },
  });
}
export function useSetPenaltyRouting() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      burnPct: number;
      rewardsPct: number;
      promoPct: number;
      reservePct: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.setPenaltyRouting(
        params.burnPct,
        params.rewardsPct,
        params.promoPct,
        params.reservePct,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakingConfig"] });
    },
  });
}

export function useSetShowPublicLedger() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (show: boolean) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.setShowPublicLedger(show);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platformToggles"] });
    },
  });
}

export function useGetPublicTransactionLedger(limit: bigint, offset: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<import("../backend").PoolActivityEntry[]>({
    queryKey: ["publicTransactionLedger", limit.toString(), offset.toString()],
    queryFn: async () => {
      if (!actor) return [];
      // Pass null-wrapped bigints as the backend accepts null | bigint
      const result = await actor.getPublicTransactionLedger(limit, offset);
      // Defensive normalisation — ensure every field has a safe default
      return (result ?? []).map((entry) => ({
        action: entry.action ?? "",
        initiator: entry.initiator ?? "",
        pool: entry.pool ?? "",
        txId: entry.txId ?? 0n,
        rewardsEarned:
          typeof entry.rewardsEarned === "number" ? entry.rewardsEarned : 0,
        timestamp: entry.timestamp ?? 0n,
        txType: entry.txType ?? "system_action",
        amount: typeof entry.amount === "number" ? entry.amount : 0,
      }));
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useGetPublicTransactionLedgerCount() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["publicTransactionLedgerCount"],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getPublicTransactionLedgerCount();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useRunScheduleNow() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (scheduleId: string) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        runScheduleNow: (
          id: string,
        ) => Promise<{ ok: string } | { err: string }>;
      };
      const result = await a.runScheduleNow(scheduleId);
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releaseSchedules"] });
      queryClient.invalidateQueries({ queryKey: ["poolDetails"] });
      queryClient.invalidateQueries({ queryKey: ["tokenSupply"] });
      queryClient.invalidateQueries({ queryKey: ["emissionStats"] });
      queryClient.invalidateQueries({ queryKey: ["poolActivityLog"] });
    },
  });
}
