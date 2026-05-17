import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  Coins,
  DollarSign,
  Filter,
  Flame,
  Lock,
  Pause,
  Play,
  RefreshCw,
  Send,
  ShieldOff,
  TrendingDown,
  TrendingUp,
  Unlock,
  Users,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { MigrationLogEntry, TreasuryPool } from "../../backend";
import { useActor } from "../../hooks/useActor";
import {
  useAutoReleasePausedConfig,
  useCheckAndAutoRelease,
  useClaimPersonalAllocation,
  useCreateReleaseSchedule,
  useDeleteReleaseSchedule,
  useEmergencyPauseAll,
  useEmissionStats,
  useExecuteScheduledReleases,
  useExpandPoolCeiling,
  useGetBurnStats,
  useGetPayoutAuditLog,
  useGetPersonalAllocationStatus,
  useGetPlatformToggles,
  useGetPoolActivityLog,
  useGetPoolDetails,
  useGetTeamPayoutLog,
  useGetTeamPayoutReserveBalance,
  useICRC1TokenInfo,
  useInitiateMigration,
  useIsMigrationCompleted,
  useIsOwnershipRenounced,
  useListReleaseSchedules,
  useMigrationLog,
  usePauseReleaseSchedule,
  useReleaseAuditLogV2,
  useReleaseEngineConfig,
  useRenounceOwnership,
  useResumeReleaseSchedule,
  useRunScheduleNow,
  useSetGamesMode,
  useSetShowHeaderCoinBalance,
  useSetShowPublicLedger,
  useSetWalletMode,
  useTokenSupply,
  useTransferFromReservePool,
  useTransferTokensTeamPayout,
  useUpdateAutoReleasePausedConfig,
  useUpdateReleaseEngineConfig,
} from "../../hooks/useQueries";
import type { ReleaseEngineConfig } from "../../types/treasury";
import ErrorBoundary, { SectionError } from "../ErrorBoundary";
import AirdropTool from "./AirdropTool";
import FundingMilestoneAdminPanel from "./FundingMilestoneAdminPanel";
import LiquidityPoolPanel from "./LiquidityPoolPanel";
import RewardSettingsPanel from "./RewardSettingsPanel";
import TransactionLedgerPanel from "./TransactionLedgerPanel";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Display label → backend pool name mapping. All values are the lowercase
 *  strings accepted by the Motoko backend. Never send raw display labels. */
const POOL_OPTIONS: { label: string; value: string }[] = [
  { label: "Rewards Pool (35M)", value: "rewards" },
  { label: "Promotions Pool (15M)", value: "promotions" },
  { label: "Reserve Pool (50M)", value: "reserve" },
  { label: "Liquidity Pool (10M)", value: "liquidity" },
  { label: "Platform / Team (10M)", value: "platform" },
  { label: "Expansion Reserve (5T)", value: "expansion" },
];

/** Kept for backward-compat with any existing usage. Maps the label to its value. */
function _normalizePoolName(displayLabel: string): string {
  const match = POOL_OPTIONS.find(
    (o) => o.label === displayLabel || o.value === displayLabel,
  );
  if (match) return match.value;
  // Fallback: first segment before "/" lowercased
  return displayLabel
    .split("/")[0]
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .trim();
}
void _normalizePoolName; // suppress unused warning — kept for future use

/** Translate raw backend error messages into plain English for the admin. */
function friendlyReleaseError(raw: string): string {
  if (raw.includes("Invalid pool name"))
    return "Invalid pool selected. Please choose a valid pool from the dropdown.";
  if (raw.includes("Token supply not initialized"))
    return "Token supply is not initialized yet. Use the Initialize Token Supply button below to set it up first.";
  if (raw.includes("Insufficient"))
    return "Not enough tokens available in that pool to complete this release.";
  if (raw.includes("paused"))
    return "Emissions are currently paused. Resume emissions before releasing tokens.";
  return raw || "Release failed. Please try again.";
}

/** Format MIK97 float: trim trailing zeros, no scientific notation, max 8 decimals */
function formatMik97(value: number | bigint): string {
  const n = typeof value === "bigint" ? Number(value) : value;
  if (!Number.isFinite(n)) return "0";
  if (n === 0) return "0";
  // toFixed(8) then strip trailing zeros
  const fixed = n.toFixed(8);
  const trimmed = fixed.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  return trimmed;
}

function fmt(n: bigint): string {
  return Number(n).toLocaleString();
}

function fmtDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleString();
}

function fmtTimestamp(ts: bigint): string {
  if (!ts || ts === 0n) return "—";
  // ts is nanoseconds
  return new Date(Number(ts) / 1_000_000).toLocaleString();
}

function fmtReason(reason: string): string {
  switch (reason) {
    case "scheduledRelease":
      return "Scheduled";
    case "rewardPoolLow":
      return "Auto (Pool Low)";
    case "adminManual":
      return "Manual";
    case "emergency":
      return "Emergency";
    default:
      return reason;
  }
}

function reasonBadgeClass(reason: string): string {
  switch (reason) {
    case "scheduledRelease":
      return "border-blue-500 text-blue-500";
    case "rewardPoolLow":
      return "border-yellow-500 text-yellow-500";
    case "adminManual":
      return "border-primary/60 text-primary";
    case "emergency":
      return "border-destructive text-destructive";
    default:
      return "border-muted-foreground text-muted-foreground";
  }
}

function intervalLabel(interval: string): string {
  switch (interval) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    default:
      return interval;
  }
}

// ── Sub-component: Pool Detail Card ──────────────────────────────────────────

function PoolDetailCard({
  pool,
}: {
  pool: {
    poolName: string;
    allocated: number;
    released: number;
    locked: number;
    burned: number;
    currentBalance: number;
    totalBoughtBack?: number;
  };
}) {
  // Defensive: treat NaN/null as 0
  const allocated = Number.isFinite(pool.allocated) ? pool.allocated : 0;
  const released = Number.isFinite(pool.released) ? pool.released : 0;
  const locked = Number.isFinite(pool.locked) ? pool.locked : 0;
  const burned = Number.isFinite(pool.burned) ? pool.burned : 0;
  const currentBalance = Number.isFinite(pool.currentBalance)
    ? pool.currentBalance
    : 0;

  // Health: currentBalance / ceiling (allocated). If ceiling is 0 → 100%
  const healthPct =
    allocated > 0
      ? Math.min(100, Math.round((currentBalance / allocated) * 100))
      : 100;
  const usedPct =
    allocated > 0 ? Math.min(100, Math.round((released / allocated) * 100)) : 0;
  const healthColor: "green" | "yellow" | "red" =
    healthPct > 50 ? "green" : healthPct >= 20 ? "yellow" : "red";

  return (
    <Card
      className="bg-card border-border"
      data-ocid={`treasury.pool_detail.${pool.poolName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">
            {pool.poolName} Pool
          </CardTitle>
          <Badge
            variant="outline"
            className={`text-xs ${
              healthColor === "green"
                ? "border-green-500 text-green-500"
                : healthColor === "yellow"
                  ? "border-yellow-500 text-yellow-500"
                  : "border-destructive text-destructive"
            }`}
          >
            {healthPct}% remaining
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">Total Allocated</span>
          <span className="text-foreground text-right font-mono">
            {formatMik97(allocated)}
          </span>
          <span className="text-muted-foreground">Released</span>
          <span className="text-foreground text-right font-mono">
            {formatMik97(released)}
          </span>
          <span className="text-muted-foreground">Locked</span>
          <span className="text-foreground text-right font-mono">
            {formatMik97(locked)}
          </span>
          <span className="text-muted-foreground">Burned</span>
          <span className="text-destructive text-right font-mono">
            {formatMik97(burned)}
          </span>
          {pool.totalBoughtBack != null && pool.totalBoughtBack > 0 && (
            <>
              <span className="text-muted-foreground">Bought Back</span>
              <span className="text-emerald-500 text-right font-mono">
                {formatMik97(pool.totalBoughtBack)}
              </span>
            </>
          )}
          <span className="text-muted-foreground">Current Balance</span>
          <span className="text-primary text-right font-mono font-semibold">
            {formatMik97(currentBalance)}
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
          <div
            className={`h-full rounded-full transition-all ${
              healthColor === "green"
                ? "bg-green-500"
                : healthColor === "yellow"
                  ? "bg-yellow-500"
                  : "bg-destructive"
            }`}
            style={{ width: `${Math.min(100, healthPct)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right">
          {usedPct}% used · {healthPct}% remaining
        </p>
      </CardContent>
    </Card>
  );
}

// ── Sub-component: Legacy PoolCard (from getTokenSupply) ─────────────────────

function PoolCard({ pool }: { pool: TreasuryPool }) {
  const { name, totalAllocated, released, locked, burned } = pool;
  const lockedPct =
    totalAllocated > 0n
      ? Math.round((Number(locked) / Number(totalAllocated)) * 100)
      : 100;
  const healthColor: "green" | "yellow" | "red" =
    lockedPct > 50 ? "green" : lockedPct >= 20 ? "yellow" : "red";

  return (
    <Card
      className="bg-card border-border"
      data-ocid={`treasury.pool.${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">
            {name} Pool
          </CardTitle>
          <Badge
            variant="outline"
            className={`text-xs ${
              healthColor === "green"
                ? "border-green-500 text-green-500"
                : healthColor === "yellow"
                  ? "border-yellow-500 text-yellow-500"
                  : "border-destructive text-destructive"
            }`}
          >
            {lockedPct}% locked
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">Total Allocated</span>
          <span className="text-foreground text-right font-mono">
            {fmt(totalAllocated)}
          </span>
          <span className="text-muted-foreground">Released</span>
          <span className="text-foreground text-right font-mono">
            {fmt(released)}
          </span>
          <span className="text-muted-foreground">Locked</span>
          <span className="text-foreground text-right font-mono">
            {fmt(locked)}
          </span>
          <span className="text-muted-foreground">Burned</span>
          <span className="text-destructive text-right font-mono">
            {fmt(burned)}
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
          <div
            className={`h-full rounded-full transition-all ${
              healthColor === "green"
                ? "bg-green-500"
                : healthColor === "yellow"
                  ? "bg-yellow-500"
                  : "bg-destructive"
            }`}
            style={{ width: `${lockedPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right">
          {lockedPct}% remaining
        </p>
      </CardContent>
    </Card>
  );
}

// ── Initialize Token Supply hook ──────────────────────────────────────────────

function useInitializeTokenSupply() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected.");
      const result = await actor.initializeTokenSupply();
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tokenSupply"] });
      queryClient.invalidateQueries({ queryKey: ["poolDetails"] });
      queryClient.invalidateQueries({ queryKey: ["emissionStats"] });
    },
  });
}

// ── Wallet count hook ─────────────────────────────────────────────────────────

function useWalletCount() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint | null>({
    queryKey: ["walletCount"],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getWalletCount();
      if (result.__kind__ === "err") return null;
      return result.ok;
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

// ── Main component ────────────────────────────────────────────────────────────

function AdminTreasuryPanelInner() {
  const queryClient = useQueryClient();
  const { actor } = useActor();
  const {
    data: config,
    isLoading: configLoading,
    isError: configError,
    refetch: refetchConfig,
  } = useReleaseEngineConfig();
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useEmissionStats();
  const {
    data: auditLogV2,
    isLoading: auditLoading,
    isError: auditError,
    refetch: refetchAudit,
  } = useReleaseAuditLogV2();
  const {
    data: supply,
    isError: supplyError,
    refetch: refetchSupply,
  } = useTokenSupply();
  const {
    data: poolDetails,
    isLoading: poolDetailsLoading,
    isError: poolDetailsError,
    refetch: refetchPoolDetails,
  } = useGetPoolDetails();
  const {
    data: burnStats,
    isLoading: burnStatsLoading,
    isError: burnStatsError,
    refetch: refetchBurnStats,
  } = useGetBurnStats();
  const {
    data: schedules,
    isLoading: schedulesLoading,
    isError: schedulesError,
    refetch: refetchSchedules,
  } = useListReleaseSchedules();
  const { data: walletCount } = useWalletCount();

  // On-chain migration hooks
  const { data: icrc1Info } = useICRC1TokenInfo();
  const { data: migrationCompleted } = useIsMigrationCompleted();
  const { data: ownershipRenounced } = useIsOwnershipRenounced();
  const { data: migrationLog } = useMigrationLog() as {
    data: MigrationLogEntry[] | undefined;
  };
  const initiateMigration = useInitiateMigration();
  const renounceOwnership = useRenounceOwnership();

  // Migration modal state
  const [showMigrateModal, setShowMigrateModal] = useState(false);
  const [migratePhrase, setMigratePhrase] = useState("");
  const [showRenounceModal, setShowRenounceModal] = useState(false);
  const [renouncePhrase, setRenouncePhrase] = useState("");

  const updateConfig = useUpdateReleaseEngineConfig();
  const autoRelease = useCheckAndAutoRelease();
  const emergencyPause = useEmergencyPauseAll();
  const { data: autoReleasePaused = false } = useAutoReleasePausedConfig();
  const updateAutoReleasePaused = useUpdateAutoReleasePausedConfig();
  const expandPool = useExpandPoolCeiling();
  const createSchedule = useCreateReleaseSchedule();
  const pauseSchedule = usePauseReleaseSchedule();
  const resumeSchedule = useResumeReleaseSchedule();
  const deleteSchedule = useDeleteReleaseSchedule();
  const runSchedules = useExecuteScheduledReleases();
  const runScheduleNow = useRunScheduleNow();
  const initSupply = useInitializeTokenSupply();

  // New treasury action hooks
  const transferTeamPayout = useTransferTokensTeamPayout();
  const {
    data: teamPayoutLog,
    isLoading: teamPayoutLogLoading,
    isError: teamPayoutLogError,
    refetch: refetchTeamPayoutLog,
  } = useGetTeamPayoutLog();
  const {
    data: personalAlloc,
    isLoading: personalAllocLoading,
    isError: personalAllocError,
    refetch: refetchPersonalAlloc,
  } = useGetPersonalAllocationStatus();
  const claimPersonalAlloc = useClaimPersonalAllocation();
  const transferReserve = useTransferFromReservePool();
  const {
    data: payoutAuditLog,
    isLoading: payoutAuditLoading,
    isError: payoutAuditError,
    refetch: refetchPayoutLog,
  } = useGetPayoutAuditLog(100);

  // Platform Visibility (3-state mode) hooks
  const { data: platformToggles } = useGetPlatformToggles();
  const setGamesMode = useSetGamesMode();
  const setWalletMode = useSetWalletMode();
  const setShowHeaderCoin = useSetShowHeaderCoinBalance();
  const setShowPublicLedger = useSetShowPublicLedger();

  // Pool Activity Log
  const {
    data: poolActivityLog,
    isLoading: poolActivityLoading,
    isError: poolActivityError,
    refetch: refetchPoolActivityLog,
  } = useGetPoolActivityLog(100);
  const [activityFilter, setActivityFilter] = useState<
    "all" | "earn" | "release" | "burn"
  >("all");
  const [activityOpen, setActivityOpen] = useState(true);

  const [localConfig, setLocalConfig] = useState<Partial<ReleaseEngineConfig>>(
    {},
  );

  // Pool Expansion state
  const [expandPool_, setExpandPool_] = useState<string>("rewards");
  const [newCeiling, setNewCeiling] = useState<string>("");
  const [expandMsg, setExpandMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Scheduled Release form state
  const [schedulePool, setSchedulePool] = useState<string>("rewards");
  const [scheduleSourcePool, setScheduleSourcePool] =
    useState<string>("reserve");
  const [scheduleAmount, setScheduleAmount] = useState<string>("");
  const [scheduleInterval, setScheduleInterval] = useState<
    "daily" | "weekly" | "monthly"
  >("weekly");
  const [scheduleMsg, setScheduleMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Expansion Reserve Release state
  const [expansionReleaseAmount, setExpansionReleaseAmount] =
    useState<string>("");
  const [expansionReleasePool, setExpansionReleasePool] =
    useState<string>("rewards");
  const [expansionReleaseLoading, setExpansionReleaseLoading] =
    useState<boolean>(false);
  const [expansionReleaseError, setExpansionReleaseError] = useState<
    string | null
  >(null);
  const [expansionReleaseSuccess, setExpansionReleaseSuccess] = useState<
    string | null
  >(null);

  // Team payout reserve balance — primary: from poolDetails 'Team Payout' pool entry
  // (injected by useGetPoolDetails from nested.teamPayoutReserve field).
  // Fallback: direct teamPayoutReserveBalance query.
  const { data: teamPayoutReserveRaw, refetch: refetchTeamPayoutReserve } =
    useGetTeamPayoutReserveBalance();

  // Derive team payout reserve balance:
  // 1. Try the injected pool entry from getPoolDetails (most up-to-date)
  // 2. Fall back to direct teamPayoutReserveBalance
  // 3. Fall back to platform/team pool balance
  const teamPayoutReserveBalance: number | null = (() => {
    // First: check if useGetPoolDetails already injected a 'Team Payout' entry
    if (Array.isArray(poolDetails) && poolDetails.length > 0) {
      const teamPayoutPool = poolDetails.find(
        (p) =>
          p.poolName.toLowerCase().includes("team payout") ||
          p.poolName.toLowerCase() === "team_payout",
      );
      if (teamPayoutPool && Number.isFinite(teamPayoutPool.currentBalance)) {
        return teamPayoutPool.currentBalance;
      }
    }
    // Second: direct teamPayoutReserve field
    if (
      teamPayoutReserveRaw !== null &&
      teamPayoutReserveRaw !== undefined &&
      Number.isFinite(teamPayoutReserveRaw)
    ) {
      return teamPayoutReserveRaw;
    }
    // Third: fall back to platform/team pool
    if (Array.isArray(poolDetails) && poolDetails.length > 0) {
      const candidates = ["platform", "platform / team", "platformteam"];
      const match = poolDetails.find((p) =>
        candidates.some((c) => p.poolName.toLowerCase().includes(c)),
      );
      if (match && Number.isFinite(match.currentBalance)) {
        return match.currentBalance;
      }
    }
    return null;
  })();

  // Personal allocation balance — from 'Team Personal' pool entry injected by useGetPoolDetails
  const _personalAllocPoolBalance: number | null = (() => {
    if (Array.isArray(poolDetails) && poolDetails.length > 0) {
      const personalPool = poolDetails.find(
        (p) =>
          p.poolName.toLowerCase().includes("team personal") ||
          p.poolName.toLowerCase() === "team_personal",
      );
      if (personalPool && Number.isFinite(personalPool.currentBalance)) {
        return personalPool.currentBalance;
      }
    }
    return personalAlloc?.claimed ? 0 : (personalAlloc?.allocated ?? null);
  })();

  // Staking vault total — from 'Staking Vault' pool entry
  const stakingVaultBalance: number | null = (() => {
    if (Array.isArray(poolDetails) && poolDetails.length > 0) {
      const stakingPool = poolDetails.find(
        (p) =>
          p.poolName.toLowerCase().includes("staking vault") ||
          p.poolName.toLowerCase() === "staking_vault",
      );
      if (stakingPool && Number.isFinite(stakingPool.currentBalance)) {
        return stakingPool.currentBalance;
      }
    }
    return null;
  })();

  // Team Payout form state
  const [teamPayoutRecipient, setTeamPayoutRecipient] = useState("");
  const [teamPayoutAmount, setTeamPayoutAmount] = useState("");
  const [teamPayoutDesc, setTeamPayoutDesc] = useState("");
  const [teamPayoutMsg, setTeamPayoutMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Personal Allocation claim state
  const [personalAllocDest, setPersonalAllocDest] = useState("");
  const [showClaimConfirm, setShowClaimConfirm] = useState(false);
  const [claimMsg, setClaimMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Reserve Pool Transfer state
  const [reserveTransferAmount, setReserveTransferAmount] = useState("");
  const [reserveTransferPool, setReserveTransferPool] = useState("rewards");
  const [reserveTransferMsg, setReserveTransferMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const currentConfig: ReleaseEngineConfig | null = config
    ? { ...config, ...localConfig }
    : null;

  const isPaused = stats?.isPaused ?? currentConfig?.isPaused ?? false;
  const rewardPct = stats ? Number(stats.rewardPoolPercent) : 0;
  const poolHealthColor: "green" | "yellow" | "red" =
    rewardPct > 50 ? "green" : rewardPct >= 15 ? "yellow" : "red";

  const pools: TreasuryPool[] = supply
    ? [
        supply.rewardsPool,
        supply.promotionsPool,
        supply.reservePool,
        supply.platformTeamPool,
        supply.liquidityPool,
      ]
    : [];

  const circulatingPct =
    supply && supply.totalMaxSupply > 0n
      ? Math.round(
          (Number(supply.currentCirculating) / Number(supply.totalMaxSupply)) *
            100,
        )
      : 0;

  // Locked = max - circulating
  const lockedSupply = supply
    ? Number(supply.totalMaxSupply) - Number(supply.currentCirculating)
    : 0;

  function handleSaveConfig() {
    if (!currentConfig) return;
    updateConfig.mutate(currentConfig, {
      onSuccess: () => {
        toast.success("Release engine settings saved.");
        setLocalConfig({});
      },
      onError: (e) => toast.error(`Failed to save: ${e.message}`),
    });
  }

  function handleAutoRelease() {
    autoRelease.mutate(undefined, {
      onSuccess: () => toast.success("Auto-release check completed."),
      onError: (e) => toast.error(`Auto-release failed: ${e.message}`),
    });
  }

  function handleEmergencyToggle(pause: boolean) {
    emergencyPause.mutate(pause, {
      onSuccess: () =>
        toast.success(pause ? "Emissions paused." : "Emissions resumed."),
      onError: (e) => toast.error(`Failed: ${e.message}`),
    });
  }

  function handleExpandPool() {
    const ceiling = Number.parseFloat(newCeiling);
    if (!Number.isFinite(ceiling) || ceiling <= 0) {
      setExpandMsg({
        type: "err",
        text: "Enter a valid ceiling amount greater than 0.",
      });
      return;
    }
    // expandPool_ is already the lowercase backend value
    expandPool.mutate(
      { poolName: expandPool_, newCeiling: ceiling },
      {
        onSuccess: (msg) => {
          const label =
            POOL_OPTIONS.find((o) => o.value === expandPool_)?.label ??
            expandPool_;
          setExpandMsg({
            type: "ok",
            text:
              String(msg) ||
              `${label} ceiling updated to ${formatMik97(ceiling)} MIK97.`,
          });
          setNewCeiling("");
          toast.success(`${label} ceiling updated.`);
          // Invalidate stale cache then immediately force a fresh fetch so
          // the pool card reflects the new ceiling + preserved locked balance.
          queryClient.invalidateQueries({ queryKey: ["poolDetails"] });
          queryClient.invalidateQueries({ queryKey: ["tokenSupply"] });
          queryClient.invalidateQueries({ queryKey: ["emissionStats"] });
          queryClient.invalidateQueries({ queryKey: ["poolActivityLog"] });
          void refetchPoolDetails();
          void refetchSupply();
        },
        onError: (e) => {
          const errMsg = friendlyReleaseError(e.message || "");
          setExpandMsg({ type: "err", text: errMsg });
          toast.error(errMsg);
        },
      },
    );
  }

  async function handleExpansionRelease() {
    const amt = Number.parseFloat(expansionReleaseAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setExpansionReleaseError("Enter a valid token amount greater than 0.");
      return;
    }
    setExpansionReleaseError(null);
    setExpansionReleaseSuccess(null);
    setExpansionReleaseLoading(true);
    try {
      if (!actor) throw new Error("Not connected.");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const actorAny = actor as any;
      if (typeof actorAny.releaseFromExpansionReserve !== "function") {
        throw new Error(
          "This feature requires a backend update. Please redeploy the backend canister.",
        );
      }
      const result = (await actorAny.releaseFromExpansionReserve(
        amt,
        expansionReleasePool,
      )) as { ok: string } | { err: string };
      if ("err" in result) {
        throw new Error(result.err);
      }
      const label =
        POOL_OPTIONS.find((o) => o.value === expansionReleasePool)?.label ??
        expansionReleasePool;
      const msg =
        result.ok ||
        `Released ${formatMik97(amt)} MIK97 from Expansion Reserve into ${label}.`;
      setExpansionReleaseSuccess(msg);
      toast.success(msg);
      setExpansionReleaseAmount("");
      queryClient.invalidateQueries({ queryKey: ["tokenSupply"] });
      queryClient.invalidateQueries({ queryKey: ["poolDetails"] });
      queryClient.invalidateQueries({ queryKey: ["emissionStats"] });
      queryClient.invalidateQueries({ queryKey: ["poolActivityLog"] });
      void refetchPoolDetails();
      void refetchSupply();
    } catch (e) {
      const errMsg = friendlyReleaseError(
        e instanceof Error ? e.message : String(e),
      );
      setExpansionReleaseError(errMsg);
      toast.error(errMsg);
    } finally {
      setExpansionReleaseLoading(false);
    }
  }

  function handleCreateSchedule() {
    const amt = Number.parseFloat(scheduleAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setScheduleMsg({
        type: "err",
        text: "Enter a valid amount greater than 0.",
      });
      return;
    }
    // schedulePool is already the lowercase backend value (destination)
    // scheduleSourcePool is "reserve" | "expansion"
    createSchedule.mutate(
      {
        poolName: schedulePool,
        sourcePool: scheduleSourcePool,
        amountPerCycle: amt,
        interval: scheduleInterval,
      },
      {
        onSuccess: () => {
          const destLabel =
            POOL_OPTIONS.find((o) => o.value === schedulePool)?.label ??
            schedulePool;
          const srcLabel =
            scheduleSourcePool === "expansion"
              ? "Expansion Reserve"
              : "Reserve Pool";
          setScheduleMsg({
            type: "ok",
            text: `Schedule created: ${formatMik97(amt)} MIK97 ${intervalLabel(scheduleInterval)} from ${srcLabel} → ${destLabel}.`,
          });
          setScheduleAmount("");
          toast.success("Release schedule created.");
          queryClient.invalidateQueries({ queryKey: ["releaseSchedules"] });
        },
        onError: (e) => {
          const errMsg = friendlyReleaseError(e.message || "");
          setScheduleMsg({ type: "err", text: errMsg });
          toast.error(errMsg);
        },
      },
    );
  }

  if (configLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        Loading treasury data…
      </div>
    );
  }

  if (configError && statsError) {
    return (
      <SectionError
        label="Treasury Panel — backend unreachable"
        onRetry={() => {
          void refetchConfig();
          void refetchStats();
        }}
      />
    );
  }

  return (
    <div className="space-y-6" data-ocid="treasury.panel">
      {/* ── Emergency Pause Banner ── */}
      {isPaused && (
        <div
          className="flex items-center justify-between gap-4 rounded-lg border border-destructive bg-destructive/10 px-5 py-4"
          data-ocid="treasury.pause_banner"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <span className="font-bold text-destructive">
              ⚠ Emissions Paused — All token earning and releases are currently
              halted.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => handleEmergencyToggle(false)}
            disabled={emergencyPause.isPending}
            data-ocid="treasury.resume_button"
          >
            <Play className="h-4 w-4 mr-1" />
            Resume Emissions
          </Button>
        </div>
      )}

      {/* ── Token Supply Overview ── */}
      {supplyError && !supply && (
        <SectionError
          label="Token Supply Overview"
          onRetry={() => void refetchSupply()}
        />
      )}
      {!supply && !configLoading && !supplyError && (
        <Card
          className="bg-card border-yellow-500/40 border"
          data-ocid="treasury.supply_uninit_card"
        >
          <CardContent className="pt-5 pb-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Token Supply Not Initialized
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                The MIK97 token supply data has not been set up yet. Click{" "}
                <strong className="text-foreground">
                  Initialize Token Supply
                </strong>{" "}
                to create the initial supply record and enable pool management,
                manual releases, and scheduled releases.
              </p>
            </div>
            <Button
              onClick={() =>
                initSupply.mutate(undefined, {
                  onSuccess: () =>
                    toast.success(
                      "Token supply initialized successfully! Pool management is now active.",
                    ),
                  onError: (e) =>
                    toast.error(
                      `Initialization failed: ${e.message || "Please try again."}`,
                    ),
                })
              }
              disabled={initSupply.isPending}
              className="bg-yellow-500 text-black hover:bg-yellow-400 font-semibold shrink-0"
              data-ocid="treasury.init_supply_button"
            >
              {initSupply.isPending
                ? "Initializing…"
                : "Initialize Token Supply"}
            </Button>
          </CardContent>
        </Card>
      )}

      {supply && (
        <div data-ocid="treasury.supply_monitor">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Token Supply Overview
          </h3>

          {/* 3-tier supply breakdown legend */}
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 mb-4 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground text-sm">
              MIK97 Token Structure
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                <span>
                  <span className="font-medium text-foreground">10M</span>{" "}
                  Circulating — active at launch
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500 shrink-0" />
                <span>
                  <span className="font-medium text-foreground">100M</span> In
                  Pools — first-layer reserve (Rewards 35M, Promos 15M, Reserve
                  50M, Liquidity 10M, Team 10M)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-muted-foreground shrink-0" />
                <span>
                  <span className="font-medium text-foreground">5T</span>{" "}
                  Expansion Reserve — fully locked, long-term only
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card
              className="bg-card border-border"
              data-ocid="treasury.supply.max"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Max Supply
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-foreground font-mono">
                  {formatMik97(Number(supply.totalMaxSupply))}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Hard ceiling (all tiers)
                </p>
              </CardContent>
            </Card>

            <Card
              className="bg-card border-primary/20 border"
              data-ocid="treasury.supply.circulating"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Circulating Supply
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* circulatingSupply is the actual user wallet sum — not pool balances or expansion reserve.
                    If backend returns a ×1e8-scaled Nat (on-chain prep), divide accordingly. */}
                {(() => {
                  const rawCirc = Number(supply.currentCirculating);
                  // Sanity check: circulating should be <= 10M at launch.
                  // If it's > 1 billion, it may be scaled by 1e8 — divide to normalize.
                  const MAX_EXPECTED_CIRCULATING = 10_000_000_000; // 10B — well above 10M launch
                  const circ =
                    rawCirc > MAX_EXPECTED_CIRCULATING
                      ? rawCirc / 1e8
                      : rawCirc;
                  const maxN = Number(supply.totalMaxSupply);
                  const maxNorm =
                    maxN > MAX_EXPECTED_CIRCULATING * 1000 ? maxN / 1e8 : maxN;
                  const pct =
                    maxNorm > 0 ? Math.round((circ / maxNorm) * 100) : 0;
                  return (
                    <>
                      <p className="text-xl font-bold text-primary font-mono">
                        {formatMik97(circ)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <TrendingUp className="h-3 w-3 text-primary" />
                        <span className="text-xs text-muted-foreground">
                          {pct}% of max
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* First-layer pool reserve (100M split across 5 pools) */}
            <Card
              className="bg-card border-yellow-500/20 border"
              data-ocid="treasury.supply.pool_reserve"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Pool Reserve (5 Pools)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-yellow-400 font-mono">
                  {formatMik97(
                    [
                      supply.rewardsPool,
                      supply.promotionsPool,
                      supply.reservePool,
                      supply.platformTeamPool,
                      supply.liquidityPool,
                    ].reduce((sum, p) => sum + Number(p.locked), 0),
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Locked in active pools
                </p>
              </CardContent>
            </Card>

            {/* Expansion reserve: totalMaxSupply - 100M pools - circulating */}
            <Card
              className="bg-card border-border"
              data-ocid="treasury.supply.expansion_reserve"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Expansion Reserve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-foreground font-mono">
                  {formatMik97(Number(supply.expansionReserve.locked))}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Lock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    fully locked (5T)
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card
              className="bg-card border-border"
              data-ocid="treasury.supply.locked"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Locked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-foreground font-mono">
                  {formatMik97(lockedSupply)}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Lock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {100 - circulatingPct}% of max
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card
              className="bg-card border-destructive/20 border"
              data-ocid="treasury.supply.burned"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Burned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-destructive font-mono">
                  {formatMik97(Number(supply.totalBurned))}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <TrendingDown className="h-3 w-3 text-destructive" />
                  <span className="text-xs text-muted-foreground">
                    permanently removed
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Total Bought Back */}
            {"totalBoughtBack" in supply && (
              <Card
                className="bg-card border-emerald-500/20 border"
                data-ocid="treasury.supply.bought_back"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Total Bought Back
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-emerald-500 font-mono">
                    {formatMik97(Number(supply.totalBoughtBack))}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs text-muted-foreground">
                      returned to pools
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── Emission Stats Row ── */}
      {stats && (
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          data-ocid="treasury.stats_row"
        >
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Today's Emissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatMik97(Number(stats.dailyReleasedToday))}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  / {formatMik97(Number(stats.maxDailyRelease))} MIK97
                </span>
              </p>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width:
                      stats.maxDailyRelease > 0n
                        ? `${Math.min(100, (Number(stats.dailyReleasedToday) / Number(stats.maxDailyRelease)) * 100)}%`
                        : "0%",
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                This Week's Emissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatMik97(Number(stats.weeklyReleasedThisWeek))}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  / {formatMik97(Number(stats.maxWeeklyRelease))} MIK97
                </span>
              </p>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width:
                      stats.maxWeeklyRelease > 0n
                        ? `${Math.min(100, (Number(stats.weeklyReleasedThisWeek) / Number(stats.maxWeeklyRelease)) * 100)}%`
                        : "0%",
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Reward Pool Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-foreground">
                  {rewardPct}%
                </p>
                <Badge
                  variant="outline"
                  className={
                    poolHealthColor === "green"
                      ? "border-green-500 text-green-500"
                      : poolHealthColor === "yellow"
                        ? "border-yellow-500 text-yellow-500"
                        : "border-destructive text-destructive"
                  }
                >
                  {poolHealthColor === "green"
                    ? "Healthy"
                    : poolHealthColor === "yellow"
                      ? "Moderate"
                      : "Low"}
                </Badge>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    poolHealthColor === "green"
                      ? "bg-green-500"
                      : poolHealthColor === "yellow"
                        ? "bg-yellow-500"
                        : "bg-destructive"
                  }`}
                  style={{ width: `${rewardPct}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Per-Pool Details ── */}
      <div data-ocid="treasury.pool_details_section">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Pool Details
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Refresh regular pools only — expansion reserve has its own section
              void refetchPoolDetails();
              void refetchStats();
              void refetchBurnStats();
              queryClient.invalidateQueries({ queryKey: ["poolActivityLog"] });
            }}
            data-ocid="treasury.pool_details.refresh_button"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh Pools
          </Button>
        </div>
        {poolDetailsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-44 rounded-lg bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        ) : poolDetailsError ? (
          <SectionError
            label="Pool Details"
            onRetry={() => void refetchPoolDetails()}
          />
        ) : Array.isArray(poolDetails) && poolDetails.length > 0 ? (
          <div className="space-y-5">
            {/* ── Core Emission Pools ── */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Core Emission Pools
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {poolDetails
                  .filter((pool) => {
                    const n = pool.poolName.toLowerCase();
                    return (
                      !n.includes("expansion") &&
                      n !== "expansion" &&
                      !n.includes("team payout") &&
                      n !== "team_payout" &&
                      !n.includes("team personal") &&
                      n !== "team_personal" &&
                      !n.includes("personal alloc") &&
                      n !== "personal_allocation" &&
                      !n.includes("staking vault") &&
                      n !== "staking_vault" &&
                      !n.includes("platform") &&
                      n !== "platform / team" &&
                      n !== "platform/team" &&
                      n !== "platformteam"
                    );
                  })
                  .map((pool) => (
                    <PoolDetailCard key={pool.poolName} pool={pool} />
                  ))}
              </div>
            </div>
            {/* ── Team Allocation Pools ── */}
            {/* ── Team Allocation Pools ── */}
            {(() => {
              const teamPayoutPool = Array.isArray(poolDetails)
                ? poolDetails.find(
                    (p) =>
                      p.poolName.toLowerCase().includes("team payout") ||
                      p.poolName.toLowerCase() === "team_payout",
                  )
                : null;
              const personalAllocPool = Array.isArray(poolDetails)
                ? poolDetails.find(
                    (p) =>
                      p.poolName.toLowerCase().includes("team personal") ||
                      p.poolName.toLowerCase() === "team_personal" ||
                      p.poolName.toLowerCase().includes("personal alloc") ||
                      p.poolName.toLowerCase() === "personal_allocation",
                  )
                : null;
              if (!teamPayoutPool && !personalAllocPool) return null;
              return (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Team Allocation
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamPayoutPool && (
                      <Card
                        className="bg-card border-border"
                        data-ocid="treasury.pool_detail.team_payout"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-primary" />
                              Team Payout Pool
                            </CardTitle>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                teamPayoutPool.currentBalance /
                                  Math.max(teamPayoutPool.allocated, 1) >
                                0.5
                                  ? "border-green-500 text-green-500"
                                  : teamPayoutPool.currentBalance /
                                        Math.max(teamPayoutPool.allocated, 1) >=
                                      0.2
                                    ? "border-yellow-500 text-yellow-500"
                                    : "border-destructive text-destructive"
                              }`}
                            >
                              {teamPayoutPool.allocated > 0
                                ? `${Math.min(
                                    100,
                                    Math.round(
                                      (teamPayoutPool.currentBalance /
                                        teamPayoutPool.allocated) *
                                        100,
                                    ),
                                  )}% remaining`
                                : "N/A"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <span className="text-muted-foreground">
                              Total Allocated
                            </span>
                            <span className="text-foreground text-right font-mono">
                              {formatMik97(teamPayoutPool.allocated)}
                            </span>
                            <span className="text-muted-foreground">
                              Released
                            </span>
                            <span className="text-foreground text-right font-mono">
                              {formatMik97(teamPayoutPool.released)}
                            </span>
                            <span className="text-muted-foreground">
                              Locked
                            </span>
                            <span className="text-foreground text-right font-mono">
                              {formatMik97(teamPayoutPool.locked)}
                            </span>
                            <span className="text-muted-foreground">
                              Burned
                            </span>
                            <span className="text-destructive text-right font-mono">
                              {formatMik97(teamPayoutPool.burned)}
                            </span>
                            <span className="text-muted-foreground">
                              Current Balance
                            </span>
                            <span className="text-primary text-right font-mono font-semibold">
                              {formatMik97(teamPayoutPool.currentBalance)}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
                            <div
                              className="h-full rounded-full transition-all bg-primary"
                              style={{
                                width: `${
                                  teamPayoutPool.allocated > 0
                                    ? Math.min(
                                        100,
                                        Math.round(
                                          (teamPayoutPool.currentBalance /
                                            teamPayoutPool.allocated) *
                                            100,
                                        ),
                                      )
                                    : 100
                                }%`,
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {personalAllocPool && (
                      <Card
                        className="bg-card border-border"
                        data-ocid="treasury.pool_detail.personal_allocation"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                              <Wallet className="h-3.5 w-3.5 text-primary" />
                              Personal Allocation Pool
                            </CardTitle>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                personalAllocPool.currentBalance /
                                  Math.max(personalAllocPool.allocated, 1) >
                                0.5
                                  ? "border-green-500 text-green-500"
                                  : personalAllocPool.currentBalance /
                                        Math.max(
                                          personalAllocPool.allocated,
                                          1,
                                        ) >=
                                      0.2
                                    ? "border-yellow-500 text-yellow-500"
                                    : "border-destructive text-destructive"
                              }`}
                            >
                              {personalAllocPool.allocated > 0
                                ? `${Math.min(
                                    100,
                                    Math.round(
                                      (personalAllocPool.currentBalance /
                                        personalAllocPool.allocated) *
                                        100,
                                    ),
                                  )}% remaining`
                                : "N/A"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <span className="text-muted-foreground">
                              Total Allocated
                            </span>
                            <span className="text-foreground text-right font-mono">
                              {formatMik97(personalAllocPool.allocated)}
                            </span>
                            <span className="text-muted-foreground">
                              Released
                            </span>
                            <span className="text-foreground text-right font-mono">
                              {formatMik97(personalAllocPool.released)}
                            </span>
                            <span className="text-muted-foreground">
                              Locked
                            </span>
                            <span className="text-foreground text-right font-mono">
                              {formatMik97(personalAllocPool.locked)}
                            </span>
                            <span className="text-muted-foreground">
                              Burned
                            </span>
                            <span className="text-destructive text-right font-mono">
                              {formatMik97(personalAllocPool.burned)}
                            </span>
                            <span className="text-muted-foreground">
                              Current Balance
                            </span>
                            <span className="text-primary text-right font-mono font-semibold">
                              {formatMik97(personalAllocPool.currentBalance)}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
                            <div
                              className="h-full rounded-full transition-all bg-primary"
                              style={{
                                width: `${
                                  personalAllocPool.allocated > 0
                                    ? Math.min(
                                        100,
                                        Math.round(
                                          (personalAllocPool.currentBalance /
                                            personalAllocPool.allocated) *
                                            100,
                                        ),
                                      )
                                    : 100
                                }%`,
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}
            {/* ── Staking Vault ── */}
            {stakingVaultBalance !== null && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Staking Vault
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card
                    className="bg-card border-primary/20 border"
                    data-ocid="treasury.pool_detail.staking_vault"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                          <Lock className="h-3.5 w-3.5 text-primary" />
                          Staking Vault
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="text-xs border-primary/40 text-primary"
                        >
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <span className="text-muted-foreground">
                          Total Staked
                        </span>
                        <span className="text-primary text-right font-mono font-semibold">
                          {formatMik97(stakingVaultBalance)}
                        </span>
                        <span className="text-muted-foreground">Source</span>
                        <span className="text-foreground text-right font-mono">
                          User wallets
                        </span>
                        <span className="text-muted-foreground">
                          Rewards from
                        </span>
                        <span className="text-foreground text-right font-mono">
                          Rewards Pool
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        User principal is separate from Rewards pool — only APY
                        interest draws from Rewards.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        ) : pools.length > 0 ? (
          /* Fallback to legacy TreasuryPool data if getPoolDetails not available */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pools.map((pool) => (
              <PoolCard key={pool.name} pool={pool} />
            ))}
          </div>
        ) : (
          <p
            className="text-muted-foreground text-sm py-4"
            data-ocid="treasury.pool_details.empty_state"
          >
            Pool data not yet initialized.
          </p>
        )}
      </div>

      {/* ── Release from Expansion Reserve ── */}
      <Card
        className="bg-card border-primary/30 border-2"
        data-ocid="treasury.expansion_release_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Unlock className="h-5 w-5" />
            Release from Expansion Reserve
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            This taps the long-term locked{" "}
            <span className="font-semibold text-foreground">5 Trillion</span>{" "}
            expansion reserve — a separate bucket from your active pools. Use
            only when pools need refilling and cannot be sustained by regular
            emissions alone. Tokens move from the reserve into the selected pool
            and then flow into circulation gradually through normal emission
            rules.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Expansion reserve balance display */}
          {supply && (
            <div
              className="rounded-lg border border-primary/20 bg-primary/5 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              data-ocid="treasury.expansion_reserve.balance_display"
            >
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  Expansion Reserve Available
                </p>
                <p className="text-3xl font-bold text-foreground font-mono">
                  {formatMik97(Number(supply.expansionReserve.locked))}
                  <span className="text-base font-normal text-muted-foreground ml-2">
                    MIK97
                  </span>
                </p>
                {(() => {
                  const EXPANSION_ORIGINAL = 5_000_000_000_000_000;
                  const locked = Number(supply.expansionReserve.locked);
                  const pct =
                    EXPANSION_ORIGINAL > 0
                      ? ((locked / EXPANSION_ORIGINAL) * 100).toFixed(4)
                      : "100.0000";
                  return (
                    <p className="text-xs text-muted-foreground mt-1">
                      {pct}% of 5T original reserve remaining
                    </p>
                  );
                })()}
              </div>
              <Badge
                variant="outline"
                className="border-primary/40 text-primary text-xs shrink-0"
              >
                Long-Term Reserve
              </Badge>
            </div>
          )}

          {/* Release form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <Label className="text-foreground">
                Amount to release (MIK97)
              </Label>
              <Input
                type="number"
                min={0}
                step="0.00000001"
                placeholder="e.g. 5000000 or 0.5"
                value={expansionReleaseAmount}
                onChange={(e) => {
                  setExpansionReleaseAmount(e.target.value);
                  setExpansionReleaseError(null);
                  setExpansionReleaseSuccess(null);
                }}
                className="bg-background border-input"
                data-ocid="treasury.expansion_release.amount_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">Destination Pool</Label>
              <Select
                value={expansionReleasePool}
                onValueChange={(v) => {
                  setExpansionReleasePool(v);
                  setExpansionReleaseError(null);
                  setExpansionReleaseSuccess(null);
                }}
              >
                <SelectTrigger
                  className="bg-background border-input"
                  data-ocid="treasury.expansion_release.pool_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {POOL_OPTIONS.filter((o) => o.value !== "expansion").map(
                    (o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                void handleExpansionRelease();
              }}
              disabled={
                expansionReleaseLoading || !expansionReleaseAmount || isPaused
              }
              className="bg-primary text-primary-foreground"
              data-ocid="treasury.expansion_release.submit_button"
            >
              {expansionReleaseLoading
                ? "Releasing…"
                : "Release from Expansion Reserve"}
            </Button>
          </div>

          {isPaused && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Releases are disabled while emissions are paused.
            </p>
          )}

          {expansionReleaseError && (
            <p
              className="text-xs text-destructive flex items-center gap-1"
              data-ocid="treasury.expansion_release.error_state"
            >
              <XCircle className="h-3.5 w-3.5 shrink-0" />
              {expansionReleaseError}
            </p>
          )}

          {expansionReleaseSuccess && (
            <p
              className="text-xs text-emerald-500 flex items-center gap-1"
              data-ocid="treasury.expansion_release.success_state"
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {expansionReleaseSuccess}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Release Engine Config ── */}
      {currentConfig && (
        <Card
          className="bg-card border-border"
          data-ocid="treasury.config_card"
        >
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Release Engine Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Auto Quick Release toggle */}
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <Label className="text-foreground font-medium">
                    Auto Quick Release
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Fires automatically when the reward pool drops below the
                    threshold — no schedule needed
                  </p>
                </div>
                <Switch
                  checked={currentConfig.autoReleaseEnabled}
                  onCheckedChange={(v) =>
                    setLocalConfig((p) => ({ ...p, autoReleaseEnabled: v }))
                  }
                  data-ocid="treasury.auto_release_toggle"
                />
              </div>

              {/* Pause auto-release only */}
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Label
                      className={`font-medium ${autoReleasePaused ? "text-yellow-400" : "text-foreground"}`}
                    >
                      Pause Auto-Release Only
                    </Label>
                    {autoReleasePaused && (
                      <span className="text-xs border border-yellow-500/40 text-yellow-500 rounded px-1.5 py-0.5">
                        PAUSED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {autoReleasePaused
                      ? "Auto threshold releases paused — manual and scheduled releases still work"
                      : "Pause auto threshold releases (manual and scheduled releases still work)"}
                  </p>
                </div>
                <Switch
                  checked={autoReleasePaused}
                  onCheckedChange={(v) =>
                    updateAutoReleasePaused.mutate(v, {
                      onSuccess: () =>
                        toast.success(
                          v ? "Auto-release paused." : "Auto-release resumed.",
                        ),
                    })
                  }
                  data-ocid="treasury.auto_release_paused_toggle"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground">
                  Reward Pool Threshold %
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={Number(
                    localConfig.rewardPoolThresholdPercent ??
                      currentConfig.rewardPoolThresholdPercent,
                  )}
                  onChange={(e) =>
                    setLocalConfig((p) => ({
                      ...p,
                      rewardPoolThresholdPercent: BigInt(
                        Math.max(1, Math.min(50, Number(e.target.value) || 15)),
                      ),
                    }))
                  }
                  className="bg-background border-input"
                  data-ocid="treasury.threshold_input"
                />
                <p className="text-xs text-muted-foreground">
                  Auto Quick Release triggers when pool drops below this %
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground">
                  Max Daily Release (MIK97)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step="0.00000001"
                  value={Number(
                    localConfig.maxDailyReleaseTokens ??
                      currentConfig.maxDailyReleaseTokens,
                  )}
                  onChange={(e) =>
                    setLocalConfig((p) => ({
                      ...p,
                      maxDailyReleaseTokens: BigInt(
                        Math.max(0, Number(e.target.value) || 0),
                      ),
                    }))
                  }
                  className="bg-background border-input"
                  data-ocid="treasury.max_daily_input"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground">
                  Max Weekly Release (MIK97)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step="0.00000001"
                  value={Number(
                    localConfig.maxWeeklyReleaseTokens ??
                      currentConfig.maxWeeklyReleaseTokens,
                  )}
                  onChange={(e) =>
                    setLocalConfig((p) => ({
                      ...p,
                      maxWeeklyReleaseTokens: BigInt(
                        Math.max(0, Number(e.target.value) || 0),
                      ),
                    }))
                  }
                  className="bg-background border-input"
                  data-ocid="treasury.max_weekly_input"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Button
                onClick={handleSaveConfig}
                disabled={
                  updateConfig.isPending ||
                  Object.keys(localConfig).length === 0
                }
                className="bg-primary text-primary-foreground"
                data-ocid="treasury.save_settings_button"
              >
                {updateConfig.isPending ? "Saving…" : "Save Settings"}
              </Button>

              <Button
                variant="outline"
                onClick={handleAutoRelease}
                disabled={autoRelease.isPending || isPaused}
                data-ocid="treasury.check_auto_release_button"
              >
                <Zap className="h-4 w-4 mr-1" />
                {autoRelease.isPending ? "Checking…" : "Check Auto-Release Now"}
              </Button>

              {isPaused ? (
                <Button
                  variant="outline"
                  className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                  onClick={() => handleEmergencyToggle(false)}
                  disabled={emergencyPause.isPending}
                  data-ocid="treasury.resume_emissions_button"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Resume Emissions
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() => handleEmergencyToggle(true)}
                  disabled={emergencyPause.isPending}
                  data-ocid="treasury.emergency_pause_button"
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Emergency Pause All Emissions
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Expand Pool Ceiling ── */}
      <Card
        className="bg-card border-border"
        data-ocid="treasury.expand_pool_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Expand Pool Ceiling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Increase the maximum allocated amount for a treasury pool. This
            moves tokens from the locked treasury into the pool ceiling without
            immediately releasing them to circulation.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <Label className="text-foreground">Pool</Label>
              <Select value={expandPool_} onValueChange={setExpandPool_}>
                <SelectTrigger
                  className="bg-background border-input"
                  data-ocid="treasury.expand_pool_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {POOL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">New Ceiling (MIK97)</Label>
              <Input
                type="number"
                min={0.00000001}
                step="0.00000001"
                placeholder="e.g. 5000000"
                value={newCeiling}
                onChange={(e) => {
                  setNewCeiling(e.target.value);
                  setExpandMsg(null);
                }}
                className="bg-background border-input"
                data-ocid="treasury.expand_pool_ceiling_input"
              />
            </div>
            <Button
              onClick={handleExpandPool}
              disabled={expandPool.isPending || !newCeiling}
              className="bg-primary text-primary-foreground"
              data-ocid="treasury.expand_pool_button"
            >
              {expandPool.isPending ? "Updating…" : "Set New Ceiling"}
            </Button>
          </div>
          {expandMsg && (
            <p
              className={`text-xs mt-1 flex items-center gap-1 ${expandMsg.type === "ok" ? "text-emerald-500" : "text-destructive"}`}
              data-ocid={`treasury.expand_pool.${expandMsg.type === "ok" ? "success_state" : "error_state"}`}
            >
              {expandMsg.type === "ok" ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 shrink-0" />
              )}
              {expandMsg.text}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Scheduled Releases ── */}
      <Card
        className="bg-card border-border"
        data-ocid="treasury.scheduled_releases_card"
      >
        <CardHeader>
          <div className="space-y-1">
            <CardTitle className="text-primary flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Scheduled Releases
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Note:</span>{" "}
              Scheduled releases run on a set interval. They are separate from{" "}
              <span className="text-primary font-medium">
                Auto Quick Release
              </span>{" "}
              (threshold-based: fires automatically when the reward pool drops
              below the configured %).
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create Schedule Form */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              Create New Schedule
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              {/* Source Pool */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Source</Label>
                <Select
                  value={scheduleSourcePool}
                  onValueChange={setScheduleSourcePool}
                >
                  <SelectTrigger
                    className="bg-background border-input"
                    data-ocid="treasury.schedule_source_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="reserve">Reserve Pool</SelectItem>
                    <SelectItem value="expansion">Expansion Reserve</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Destination Pool */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Destination Pool
                </Label>
                <Select value={schedulePool} onValueChange={setSchedulePool}>
                  <SelectTrigger
                    className="bg-background border-input"
                    data-ocid="treasury.schedule_pool_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {POOL_OPTIONS.filter(
                      (o) => o.value !== "expansion" && o.value !== "reserve",
                    ).map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Amount Per Cycle (MIK97)
                </Label>
                <Input
                  type="number"
                  min={0.00000001}
                  step="0.00000001"
                  placeholder="e.g. 50000"
                  value={scheduleAmount}
                  onChange={(e) => {
                    setScheduleAmount(e.target.value);
                    setScheduleMsg(null);
                  }}
                  className="bg-background border-input"
                  data-ocid="treasury.schedule_amount_input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Interval
                </Label>
                <Select
                  value={scheduleInterval}
                  onValueChange={(v) =>
                    setScheduleInterval(v as "daily" | "weekly" | "monthly")
                  }
                >
                  <SelectTrigger
                    className="bg-background border-input"
                    data-ocid="treasury.schedule_interval_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreateSchedule}
                disabled={createSchedule.isPending || !scheduleAmount}
                className="bg-primary text-primary-foreground"
                data-ocid="treasury.create_schedule_button"
              >
                {createSchedule.isPending ? "Creating…" : "Create Schedule"}
              </Button>
            </div>
            {scheduleMsg && (
              <p
                className={`text-xs flex items-center gap-1 ${scheduleMsg.type === "ok" ? "text-emerald-500" : "text-destructive"}`}
                data-ocid={`treasury.create_schedule.${scheduleMsg.type === "ok" ? "success_state" : "error_state"}`}
              >
                {scheduleMsg.type === "ok" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 shrink-0" />
                )}
                {scheduleMsg.text}
              </p>
            )}
          </div>

          {/* Run Now + Active Schedules */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">
                Active Schedules
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  runSchedules.mutate(undefined, {
                    onSuccess: (msg) => {
                      toast.success(
                        String(msg) || "Scheduled releases executed.",
                      );
                      queryClient.invalidateQueries({
                        queryKey: ["poolDetails"],
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["tokenSupply"],
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["emissionStats"],
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["poolActivityLog"],
                      });
                      void refetchPoolDetails();
                      void refetchSupply();
                    },
                    onError: (e) => toast.error(`Run failed: ${e.message}`),
                  });
                }}
                disabled={runSchedules.isPending}
                data-ocid="treasury.run_schedules_button"
              >
                <Zap className="h-4 w-4 mr-1" />
                {runSchedules.isPending ? "Running…" : "Run Now"}
              </Button>
            </div>

            {schedulesLoading ? (
              <div className="animate-pulse h-20 rounded bg-muted/30" />
            ) : schedulesError ? (
              <SectionError
                label="Scheduled Releases"
                onRetry={() => void refetchSchedules()}
              />
            ) : !schedules || schedules.length === 0 ? (
              <p
                className="text-muted-foreground text-sm py-4 text-center"
                data-ocid="treasury.schedules.empty_state"
              >
                No scheduled releases yet. Create one above.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">
                        Pool
                      </TableHead>
                      <TableHead className="text-muted-foreground text-right">
                        Amount/Cycle
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Interval
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Next Run
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Status
                      </TableHead>
                      <TableHead className="text-muted-foreground text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.map((sched, i) => (
                      <TableRow
                        key={sched.scheduleId}
                        className="border-border"
                        data-ocid={`treasury.schedule.item.${i + 1}`}
                      >
                        <TableCell className="text-sm text-foreground font-medium">
                          {sched.poolName}
                        </TableCell>
                        <TableCell className="text-sm text-foreground text-right font-mono">
                          {formatMik97(sched.amountPerCycle)}
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
                          {intervalLabel(sched.interval)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {fmtTimestamp(sched.nextRunTime)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${sched.isPaused ? "border-yellow-500 text-yellow-500" : "border-green-500 text-green-500"}`}
                          >
                            {sched.isPaused ? "Paused" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-primary/40 text-primary hover:bg-primary/10"
                              onClick={() =>
                                runScheduleNow.mutate(sched.scheduleId, {
                                  onSuccess: (msg) => {
                                    toast.success(
                                      String(msg) ||
                                        "Schedule executed successfully.",
                                    );
                                    queryClient.invalidateQueries({
                                      queryKey: ["poolDetails"],
                                    });
                                    queryClient.invalidateQueries({
                                      queryKey: ["tokenSupply"],
                                    });
                                    queryClient.invalidateQueries({
                                      queryKey: ["emissionStats"],
                                    });
                                    queryClient.invalidateQueries({
                                      queryKey: ["poolActivityLog"],
                                    });
                                    void refetchPoolDetails();
                                    void refetchSupply();
                                  },
                                  onError: (e) =>
                                    toast.error(`Run failed: ${e.message}`),
                                })
                              }
                              disabled={runScheduleNow.isPending}
                              data-ocid={`treasury.schedule.run_now_button.${i + 1}`}
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              Run
                            </Button>
                            {sched.isPaused ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs border-green-500 text-green-500 hover:bg-green-500/10"
                                onClick={() =>
                                  resumeSchedule.mutate(sched.scheduleId, {
                                    onSuccess: () =>
                                      toast.success("Schedule resumed."),
                                    onError: (e) =>
                                      toast.error(
                                        `Resume failed: ${e.message}`,
                                      ),
                                  })
                                }
                                disabled={resumeSchedule.isPending}
                                data-ocid={`treasury.schedule.resume_button.${i + 1}`}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Resume
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                                onClick={() =>
                                  pauseSchedule.mutate(sched.scheduleId, {
                                    onSuccess: () =>
                                      toast.success("Schedule paused."),
                                    onError: (e) =>
                                      toast.error(`Pause failed: ${e.message}`),
                                  })
                                }
                                disabled={pauseSchedule.isPending}
                                data-ocid={`treasury.schedule.pause_button.${i + 1}`}
                              >
                                <Pause className="h-3 w-3 mr-1" />
                                Pause
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-destructive text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                deleteSchedule.mutate(sched.scheduleId, {
                                  onSuccess: () =>
                                    toast.success("Schedule deleted."),
                                  onError: (e) =>
                                    toast.error(`Delete failed: ${e.message}`),
                                })
                              }
                              disabled={deleteSchedule.isPending}
                              data-ocid={`treasury.schedule.delete_button.${i + 1}`}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Reward Settings ── */}
      <RewardSettingsPanel />

      {/* ── Team Payouts ── */}
      <Card
        className="bg-card border-border"
        data-ocid="treasury.team_payouts_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Payouts
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Send MIK97 tokens from your team payout reserve to a wallet address.
            Every payment is logged below. Use this to pay collaborators or team
            members.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Team payout reserve balance */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 shrink-0" />
                Team Payout Reserve
              </p>
              <p
                className="text-2xl font-bold text-foreground font-mono"
                data-ocid="treasury.team_payouts.reserve_balance"
              >
                {teamPayoutReserveBalance !== null &&
                Number.isFinite(teamPayoutReserveBalance)
                  ? formatMik97(teamPayoutReserveBalance)
                  : poolDetailsLoading
                    ? "…"
                    : "0"}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  MIK97
                </span>
              </p>
            </div>
            <Badge
              variant="outline"
              className="border-primary/40 text-primary text-xs shrink-0"
            >
              Team Payout Pool
            </Badge>
          </div>

          {/* Team payout pool stats from team_payout pool entry */}
          {(() => {
            const tpPool = Array.isArray(poolDetails)
              ? poolDetails.find(
                  (p) =>
                    p.poolName.toLowerCase().includes("team payout") ||
                    p.poolName.toLowerCase() === "team_payout",
                )
              : null;
            if (!tpPool) return null;
            const tpHealthPct =
              tpPool.allocated > 0
                ? Math.min(
                    100,
                    Math.round(
                      (tpPool.currentBalance / tpPool.allocated) * 100,
                    ),
                  )
                : 100;
            const tpWidthStyle = { width: `${Math.min(100, tpHealthPct)}%` };
            return (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs rounded-lg border border-border bg-muted/10 px-4 py-3">
                <span className="text-muted-foreground">Total Allocated</span>
                <span className="text-foreground text-right font-mono">
                  {formatMik97(tpPool.allocated)}
                </span>
                <span className="text-muted-foreground">Released</span>
                <span className="text-foreground text-right font-mono">
                  {formatMik97(tpPool.released)}
                </span>
                <span className="text-muted-foreground">Locked</span>
                <span className="text-foreground text-right font-mono">
                  {formatMik97(tpPool.locked)}
                </span>
                <span className="text-muted-foreground">Burned</span>
                <span className="text-destructive text-right font-mono">
                  {formatMik97(tpPool.burned)}
                </span>
                <span className="text-muted-foreground">Current Balance</span>
                <span className="text-primary text-right font-mono font-semibold">
                  {formatMik97(tpPool.currentBalance)}
                </span>
                <div className="col-span-2 w-full h-2 bg-muted rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full rounded-full transition-all bg-primary"
                    style={tpWidthStyle}
                  />
                </div>
              </div>
            );
          })()}
          {/* Payout form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-foreground">
                Recipient Principal Address
              </Label>
              <input
                type="text"
                placeholder="e.g. aaaaa-aa or full principal"
                value={teamPayoutRecipient}
                onChange={(e) => {
                  setTeamPayoutRecipient(e.target.value);
                  setTeamPayoutMsg(null);
                }}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                data-ocid="treasury.team_payouts.recipient_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">Amount (MIK97)</Label>
              <input
                type="number"
                min={0}
                step="0.00000001"
                placeholder="e.g. 100000 or 0.5"
                value={teamPayoutAmount}
                onChange={(e) => {
                  setTeamPayoutAmount(e.target.value);
                  setTeamPayoutMsg(null);
                }}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                data-ocid="treasury.team_payouts.amount_input"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-foreground">Description (optional)</Label>
              <input
                type="text"
                placeholder="e.g. Producer fee, collaboration, etc."
                value={teamPayoutDesc}
                onChange={(e) => {
                  setTeamPayoutDesc(e.target.value);
                }}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                data-ocid="treasury.team_payouts.desc_input"
              />
            </div>
          </div>
          <Button
            onClick={() => {
              const amt = Number.parseFloat(teamPayoutAmount);
              if (!teamPayoutRecipient.trim()) {
                setTeamPayoutMsg({
                  type: "err",
                  text: "Enter a valid recipient principal address.",
                });
                return;
              }
              if (!Number.isFinite(amt) || amt <= 0) {
                setTeamPayoutMsg({
                  type: "err",
                  text: "Enter a valid amount greater than 0.",
                });
                return;
              }
              setTeamPayoutMsg(null);
              transferTeamPayout.mutate(
                {
                  recipientPrincipal: teamPayoutRecipient.trim(),
                  amount: amt,
                  description: teamPayoutDesc.trim(),
                },
                {
                  onSuccess: (r) => {
                    setTeamPayoutMsg({
                      type: "ok",
                      text: `Sent ${formatMik97(r.amountPaid)} MIK97. New reserve: ${formatMik97(r.newTeamPayoutReserve)} MIK97.`,
                    });
                    toast.success(
                      `Payout of ${formatMik97(r.amountPaid)} MIK97 sent.`,
                    );
                    setTeamPayoutRecipient("");
                    setTeamPayoutAmount("");
                    setTeamPayoutDesc("");
                    // Immediately refresh pool balances and team payout log
                    void refetchPoolDetails();
                    void refetchTeamPayoutLog();
                    void refetchTeamPayoutReserve();
                  },
                  onError: (e) => {
                    const msg = e.message || "Payout failed.";
                    setTeamPayoutMsg({ type: "err", text: msg });
                    toast.error(msg);
                  },
                },
              );
            }}
            disabled={
              transferTeamPayout.isPending ||
              !teamPayoutRecipient ||
              !teamPayoutAmount
            }
            className="bg-primary text-primary-foreground"
            data-ocid="treasury.team_payouts.send_button"
          >
            <Send className="h-4 w-4 mr-2" />
            {transferTeamPayout.isPending ? "Sending…" : "Send Payment"}
          </Button>
          {teamPayoutMsg && (
            <p
              className={`text-xs flex items-center gap-1 ${teamPayoutMsg.type === "ok" ? "text-emerald-500" : "text-destructive"}`}
              data-ocid={`treasury.team_payouts.${teamPayoutMsg.type === "ok" ? "success_state" : "error_state"}`}
            >
              {teamPayoutMsg.type === "ok" ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 shrink-0" />
              )}
              {teamPayoutMsg.text}
            </p>
          )}

          {/* Payout history table */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Payout History
            </h4>
            {teamPayoutLogLoading ? (
              <div className="animate-pulse h-16 rounded bg-muted/30" />
            ) : teamPayoutLogError ? (
              <SectionError
                label="Payout History"
                onRetry={() => void refetchTeamPayoutLog()}
              />
            ) : !teamPayoutLog || teamPayoutLog.length === 0 ? (
              <p
                className="text-muted-foreground text-sm py-4 text-center"
                data-ocid="treasury.team_payouts.empty_state"
              >
                No team payouts yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">
                        Time
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Recipient
                      </TableHead>
                      <TableHead className="text-muted-foreground text-right">
                        Amount
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Description
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...teamPayoutLog]
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .slice(0, 50)
                      .map((entry, i) => (
                        <TableRow
                          key={`${entry.id}-${i}`}
                          className="border-border"
                          data-ocid={`treasury.team_payouts.item.${i + 1}`}
                        >
                          <TableCell className="text-xs text-foreground whitespace-nowrap">
                            {new Date(
                              entry.timestamp / 1_000_000,
                            ).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-[140px]">
                            {entry.recipient.slice(0, 12)}…
                          </TableCell>
                          <TableCell className="text-sm text-primary text-right font-mono font-semibold">
                            {formatMik97(entry.amount)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {entry.category || entry.actionType || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Personal Allocation ── */}
      <Card
        className="bg-card border-primary/30 border-2"
        data-ocid="treasury.personal_allocation_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Personal Allocation
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Your 5,000,000 MIK97 personal allocation from the Personal
            Allocation Pool. Claim once — tokens transfer to your wallet
            principal.
            <span className="text-destructive font-medium">
              {" "}
              This action is permanent and cannot be undone.
            </span>
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {personalAllocLoading && !poolDetails ? (
            <div className="animate-pulse h-16 rounded bg-muted/30" />
          ) : personalAllocError ? (
            <SectionError
              label="Personal Allocation"
              onRetry={() => void refetchPersonalAlloc()}
            />
          ) : !personalAlloc ? (
            <p
              className="text-muted-foreground text-sm py-2"
              data-ocid="treasury.personal_allocation.empty_state"
            >
              Allocation data not available.
            </p>
          ) : (
            <>
              {/* Pool stats from team_personal pool entry */}
              {(() => {
                const personalPool = Array.isArray(poolDetails)
                  ? poolDetails.find(
                      (p) =>
                        p.poolName.toLowerCase().includes("team personal") ||
                        p.poolName.toLowerCase() === "team_personal" ||
                        p.poolName.toLowerCase().includes("personal alloc") ||
                        p.poolName.toLowerCase() === "personal_allocation",
                    )
                  : null;
                if (!personalPool) return null;
                const palHealthPct =
                  personalPool.allocated > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (personalPool.currentBalance /
                            personalPool.allocated) *
                            100,
                        ),
                      )
                    : 100;
                const widthStyle = { width: `${Math.min(100, palHealthPct)}%` };
                return (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs rounded-lg border border-border bg-muted/10 px-4 py-3">
                    <span className="text-muted-foreground">
                      Total Allocated
                    </span>
                    <span className="text-foreground text-right font-mono">
                      {formatMik97(personalPool.allocated)}
                    </span>
                    <span className="text-muted-foreground">Released</span>
                    <span className="text-foreground text-right font-mono">
                      {formatMik97(personalPool.released)}
                    </span>
                    <span className="text-muted-foreground">Locked</span>
                    <span className="text-foreground text-right font-mono">
                      {formatMik97(personalPool.locked)}
                    </span>
                    <span className="text-muted-foreground">Burned</span>
                    <span className="text-destructive text-right font-mono">
                      {formatMik97(personalPool.burned)}
                    </span>
                    <span className="text-muted-foreground">
                      Current Balance
                    </span>
                    <span className="text-primary text-right font-mono font-semibold">
                      {formatMik97(personalPool.currentBalance)}
                    </span>
                    <div className="col-span-2 w-full h-2 bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full rounded-full transition-all bg-primary"
                        style={widthStyle}
                      />
                    </div>
                  </div>
                );
              })()}
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Your Personal Allocation
                  </p>
                  <p
                    className="text-3xl font-bold text-foreground font-mono"
                    data-ocid="treasury.personal_allocation.amount"
                  >
                    {formatMik97(
                      (() => {
                        const pp = Array.isArray(poolDetails)
                          ? poolDetails.find(
                              (p) =>
                                p.poolName
                                  .toLowerCase()
                                  .includes("team personal") ||
                                p.poolName.toLowerCase() === "team_personal" ||
                                p.poolName
                                  .toLowerCase()
                                  .includes("personal alloc"),
                            )
                          : null;
                        return pp ? pp.currentBalance : personalAlloc.allocated;
                      })(),
                    )}
                    <span className="text-base font-normal text-muted-foreground ml-2">
                      MIK97
                    </span>
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs shrink-0 ${
                    personalAlloc.claimed
                      ? "border-green-500 text-green-500"
                      : "border-primary/40 text-primary"
                  }`}
                  data-ocid="treasury.personal_allocation.status_badge"
                >
                  {personalAlloc.claimed ? "Claimed" : "Available to claim"}
                </Badge>
              </div>

              {personalAlloc.claimed ? (
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 space-y-1">
                  <p className="text-sm text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Allocation claimed on{" "}
                    {personalAlloc.claimedAt
                      ? new Date(
                          personalAlloc.claimedAt / 1_000_000,
                        ).toLocaleString()
                      : "—"}
                  </p>
                  {personalAlloc.destination && (
                    <p className="text-xs text-muted-foreground font-mono pl-6">
                      Sent to: {personalAlloc.destination.slice(0, 20)}…
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-foreground">
                      Destination Principal Address
                    </Label>
                    <input
                      type="text"
                      placeholder="Your wallet principal (e.g. aaaaa-aa...)"
                      value={personalAllocDest}
                      onChange={(e) => {
                        setPersonalAllocDest(e.target.value);
                        setClaimMsg(null);
                      }}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      data-ocid="treasury.personal_allocation.dest_input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the principal address of your external wallet (Plug,
                      NFID, etc.)
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      if (!personalAllocDest.trim()) {
                        setClaimMsg({
                          type: "err",
                          text: "Enter a valid destination principal address.",
                        });
                        return;
                      }
                      setShowClaimConfirm(true);
                    }}
                    disabled={
                      !personalAllocDest.trim() || claimPersonalAlloc.isPending
                    }
                    className="bg-primary text-primary-foreground"
                    data-ocid="treasury.personal_allocation.claim_button"
                  >
                    <Unlock className="h-4 w-4 mr-2" />
                    Claim Allocation
                  </Button>
                  {claimMsg && (
                    <p
                      className={`text-xs flex items-center gap-1 ${claimMsg.type === "ok" ? "text-emerald-500" : "text-destructive"}`}
                      data-ocid={`treasury.personal_allocation.${claimMsg.type === "ok" ? "success_state" : "error_state"}`}
                    >
                      {claimMsg.type === "ok" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 shrink-0" />
                      )}
                      {claimMsg.text}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Personal Allocation Confirm Modal */}
      {showClaimConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          data-ocid="treasury.personal_allocation.dialog"
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-400 shrink-0" />
              <h2 className="text-lg font-bold text-foreground">
                Confirm Allocation Claim
              </h2>
            </div>
            <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 space-y-1">
              <p className="text-sm text-yellow-400 font-semibold">
                This action cannot be undone.
              </p>
              <p className="text-sm text-muted-foreground">
                This will send{" "}
                <span className="font-mono font-semibold text-foreground">
                  {personalAlloc ? formatMik97(personalAlloc.allocated) : "—"}{" "}
                  MIK97
                </span>{" "}
                to:
              </p>
              <p className="text-xs font-mono text-foreground break-all">
                {personalAllocDest}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-border text-foreground"
                onClick={() => setShowClaimConfirm(false)}
                data-ocid="treasury.personal_allocation.cancel_button"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground"
                disabled={claimPersonalAlloc.isPending}
                onClick={() => {
                  claimPersonalAlloc.mutate(personalAllocDest.trim(), {
                    onSuccess: (r) => {
                      const amt =
                        typeof r.amountClaimed === "number"
                          ? r.amountClaimed
                          : Number(r.amountClaimed);
                      setClaimMsg({
                        type: "ok",
                        text: `Successfully claimed ${formatMik97(amt)} MIK97.`,
                      });
                      toast.success(
                        `Personal allocation claimed: ${formatMik97(amt)} MIK97.`,
                      );
                      setShowClaimConfirm(false);
                      setPersonalAllocDest("");
                      // Immediately refresh pool balances so the card reflects the deduction
                      void refetchPoolDetails();
                      void refetchPersonalAlloc();
                    },
                    onError: (e) => {
                      setClaimMsg({
                        type: "err",
                        text: e.message || "Claim failed.",
                      });
                      toast.error(e.message || "Claim failed.");
                      setShowClaimConfirm(false);
                    },
                  });
                }}
                data-ocid="treasury.personal_allocation.confirm_button"
              >
                {claimPersonalAlloc.isPending ? "Claiming…" : "Confirm Claim"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reserve Pool Transfer ── */}
      <Card
        className="bg-card border-border"
        data-ocid="treasury.reserve_transfer_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Reserve Pool Transfer
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Move tokens from the{" "}
            <span className="font-semibold text-foreground">Reserve Pool</span>{" "}
            into the Rewards or Promotions pool. Use this when active emission
            pools run low and you don't need to tap the 5T expansion reserve
            yet.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reserve pool current balance — reads ONLY from the 'reserve' pool entry.
             Shows loading state while pools are being fetched. */}
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Reserve Pool Balance
            </span>
            <span
              className="text-sm font-bold text-foreground font-mono"
              data-ocid="treasury.reserve_transfer.balance"
            >
              {poolDetailsLoading
                ? "…"
                : formatMik97(
                    Array.isArray(poolDetails)
                      ? (poolDetails.find((p) => {
                          const n = p.poolName.toLowerCase();
                          return (
                            n === "reserve" ||
                            n === "reserve pool" ||
                            (n.includes("reserve") &&
                              !n.includes("expansion") &&
                              !n.includes("staking"))
                          );
                        })?.currentBalance ?? 0)
                      : 0,
                  )}{" "}
              MIK97
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <Label className="text-foreground">Amount (MIK97)</Label>
              <input
                type="number"
                min={0}
                step="0.00000001"
                placeholder="e.g. 500000"
                value={reserveTransferAmount}
                onChange={(e) => {
                  setReserveTransferAmount(e.target.value);
                  setReserveTransferMsg(null);
                }}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                data-ocid="treasury.reserve_transfer.amount_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">Target Pool</Label>
              <Select
                value={reserveTransferPool}
                onValueChange={(v) => {
                  setReserveTransferPool(v);
                  setReserveTransferMsg(null);
                }}
              >
                <SelectTrigger
                  className="bg-background border-input"
                  data-ocid="treasury.reserve_transfer.pool_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="rewards">Rewards Pool (35M)</SelectItem>
                  <SelectItem value="promotions">
                    Promotions Pool (15M)
                  </SelectItem>
                  <SelectItem value="liquidity">
                    Liquidity Pool (10M)
                  </SelectItem>
                  <SelectItem value="platform">
                    Platform / Team (10M)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                const amt = Number.parseFloat(reserveTransferAmount);
                if (!Number.isFinite(amt) || amt <= 0) {
                  setReserveTransferMsg({
                    type: "err",
                    text: "Enter a valid amount greater than 0.",
                  });
                  return;
                }
                setReserveTransferMsg(null);
                transferReserve.mutate(
                  { targetPool: reserveTransferPool, amount: amt },
                  {
                    onSuccess: (msg) => {
                      const label =
                        reserveTransferPool === "rewards"
                          ? "Rewards"
                          : "Promotions";
                      const text =
                        String(msg) ||
                        `Transferred ${formatMik97(amt)} MIK97 from Reserve into ${label} Pool.`;
                      setReserveTransferMsg({ type: "ok", text });
                      toast.success(text);
                      setReserveTransferAmount("");
                      // Only refresh pool details (regular pools) — NOT tokenSupply/expansion reserve
                      queryClient.invalidateQueries({
                        queryKey: ["poolDetails"],
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["emissionStats"],
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["poolActivityLog"],
                      });
                      void refetchPoolDetails();
                      // Do NOT call refetchSupply() here — that would update the
                      // expansion reserve display when only a reserve pool transfer happened
                    },
                    onError: (e) => {
                      const text = e.message || "Transfer failed.";
                      setReserveTransferMsg({ type: "err", text });
                      toast.error(text);
                    },
                  },
                );
              }}
              disabled={transferReserve.isPending || !reserveTransferAmount}
              className="bg-primary text-primary-foreground"
              data-ocid="treasury.reserve_transfer.submit_button"
            >
              {transferReserve.isPending ? "Transferring…" : "Transfer to Pool"}
            </Button>
          </div>
          {reserveTransferMsg && (
            <p
              className={`text-xs flex items-center gap-1 ${reserveTransferMsg.type === "ok" ? "text-emerald-500" : "text-destructive"}`}
              data-ocid={`treasury.reserve_transfer.${reserveTransferMsg.type === "ok" ? "success_state" : "error_state"}`}
            >
              {reserveTransferMsg.type === "ok" ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 shrink-0" />
              )}
              {reserveTransferMsg.text}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Airdrop Tool (Promotions Pool) ── */}
      <AirdropTool />

      {/* ── Liquidity Pool Interface ── */}
      <LiquidityPoolPanel />

      {/* ── Funding Milestone ── */}
      <FundingMilestoneAdminPanel />

      {/* ── Platform Visibility Controls (3-State Mode) ── */}
      <Card
        className="bg-card border-border"
        data-ocid="treasury.platform_visibility_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Platform Visibility
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Control how each section appears to users. Admin always sees the
            full live content regardless of this setting.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Games mode */}
          <div
            className="space-y-2"
            data-ocid="treasury.platform_visibility.games_row"
          >
            <p className="text-sm font-semibold text-foreground">
              Games (Jumper &amp; Flappy)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["live", "comingSoon", "hidden"] as const).map((mode) => {
                const current = platformToggles?.gamesMode ?? "live";
                const labels = {
                  live: "Live",
                  comingSoon: "Coming Soon",
                  hidden: "Hidden",
                } as const;
                const active = current === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    data-ocid={`treasury.platform_visibility.games_${mode}_button`}
                    disabled={setGamesMode.isPending}
                    onClick={() =>
                      setGamesMode.mutate(mode, {
                        onSuccess: () =>
                          toast.success(`Games set to ${labels[mode]}.`),
                        onError: (e) => toast.error(`Failed: ${e.message}`),
                      })
                    }
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                      active
                        ? mode === "hidden"
                          ? "border-destructive bg-destructive/10 text-destructive"
                          : mode === "comingSoon"
                            ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                            : "border-green-500 bg-green-500/10 text-green-500"
                        : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {labels[mode]}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {platformToggles?.gamesMode === "hidden"
                ? "Games tab is fully removed from navigation for non-admin users."
                : platformToggles?.gamesMode === "comingSoon"
                  ? "Users see a Coming Soon screen when they visit Games."
                  : "Games page is live — users can play Jumper and Flappy."}
            </p>
          </div>

          {/* Wallet mode */}
          <div
            className="space-y-2"
            data-ocid="treasury.platform_visibility.wallet_row"
          >
            <p className="text-sm font-semibold text-foreground">
              Wallet &amp; Rewards
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["live", "comingSoon", "hidden"] as const).map((mode) => {
                const current = platformToggles?.walletMode ?? "live";
                const labels = {
                  live: "Live",
                  comingSoon: "Coming Soon",
                  hidden: "Hidden",
                } as const;
                const active = current === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    data-ocid={`treasury.platform_visibility.wallet_${mode}_button`}
                    disabled={setWalletMode.isPending}
                    onClick={() =>
                      setWalletMode.mutate(mode, {
                        onSuccess: () =>
                          toast.success(`Wallet set to ${labels[mode]}.`),
                        onError: (e) => toast.error(`Failed: ${e.message}`),
                      })
                    }
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                      active
                        ? mode === "hidden"
                          ? "border-destructive bg-destructive/10 text-destructive"
                          : mode === "comingSoon"
                            ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                            : "border-green-500 bg-green-500/10 text-green-500"
                        : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {labels[mode]}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {platformToggles?.walletMode === "hidden"
                ? "Wallet tab is fully removed from navigation for non-admin users."
                : platformToggles?.walletMode === "comingSoon"
                  ? "Users see a Coming Soon screen when they visit Wallet."
                  : "Wallet page is live — users can view balances and earn history."}
            </p>
          </div>

          {/* Header Coin Balance toggle */}
          <div
            className="flex items-center justify-between rounded-lg border border-border p-4"
            data-ocid="treasury.platform_visibility.header_coin_row"
          >
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">
                Token Balance in Header
              </p>
              <p className="text-xs text-muted-foreground">
                {platformToggles?.showHeaderCoinBalance !== false
                  ? "Users see their MIK97 balance in the top header bar."
                  : "Balance is hidden from the header — users only see it on the Wallet page."}
              </p>
            </div>
            <Switch
              checked={platformToggles?.showHeaderCoinBalance ?? true}
              onCheckedChange={(v) =>
                setShowHeaderCoin.mutate(v, {
                  onSuccess: () =>
                    toast.success(
                      v
                        ? "Token balance shown in header."
                        : "Token balance hidden from header.",
                    ),
                  onError: (e) => toast.error(`Failed to update: ${e.message}`),
                })
              }
              disabled={setShowHeaderCoin.isPending}
              data-ocid="treasury.platform_visibility.header_coin_toggle"
            />
          </div>

          {/* Public Transaction Ledger toggle */}
          <div
            className="flex items-center justify-between rounded-lg border border-border p-4"
            data-ocid="treasury.platform_visibility.public_ledger_row"
          >
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">
                Public Transaction Ledger
              </p>
              <p className="text-xs text-muted-foreground">
                {platformToggles?.showPublicLedger
                  ? "Transaction ledger is public — anyone can visit /ledger to view all token movements."
                  : "Ledger is hidden from regular users. Only you (admin) can access /ledger."}
              </p>
            </div>
            <Switch
              checked={platformToggles?.showPublicLedger ?? false}
              onCheckedChange={(v) =>
                setShowPublicLedger.mutate(v, {
                  onSuccess: () =>
                    toast.success(
                      v
                        ? "Public ledger is now visible to all users."
                        : "Public ledger is now hidden from regular users.",
                    ),
                  onError: (e) => toast.error(`Failed to update: ${e.message}`),
                })
              }
              disabled={setShowPublicLedger.isPending}
              data-ocid="treasury.platform_visibility.public_ledger_toggle"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Payout History (Reward Audit Log) ── */}
      <Card
        className="bg-card border-border"
        data-ocid="treasury.payout_history_card"
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-primary flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Payout History
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void refetchPayoutLog();
              }}
              data-ocid="treasury.payout_history.refresh_button"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            All token payouts from treasury pools — games, music, live, bonuses,
            and team transfers.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {payoutAuditLoading ? (
            <p className="text-muted-foreground text-sm px-6 py-4">
              Loading payout history…
            </p>
          ) : payoutAuditError ? (
            <div className="px-6 py-4">
              <SectionError
                label="Payout History"
                onRetry={() => void refetchPayoutLog()}
              />
            </div>
          ) : !payoutAuditLog || payoutAuditLog.length === 0 ? (
            <p
              className="text-muted-foreground text-sm px-6 py-6 text-center"
              data-ocid="treasury.payout_history.empty_state"
            >
              No payout events yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">
                      Time
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Recipient
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right">
                      Amount
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Category
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Action
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Pool
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...payoutAuditLog]
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 100)
                    .map((entry, i) => (
                      <TableRow
                        key={`${entry.id}-${i}`}
                        className="border-border"
                        data-ocid={`treasury.payout_history.item.${i + 1}`}
                      >
                        <TableCell className="text-xs text-foreground whitespace-nowrap">
                          {new Date(
                            entry.timestamp / 1_000_000,
                          ).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-[130px]">
                          {entry.recipient.slice(0, 12)}…
                        </TableCell>
                        <TableCell className="text-sm text-primary text-right font-mono font-semibold">
                          {formatMik97(entry.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs capitalize ${
                              entry.category === "games"
                                ? "border-blue-500 text-blue-500"
                                : entry.category === "music"
                                  ? "border-purple-500 text-purple-500"
                                  : entry.category === "live"
                                    ? "border-yellow-500 text-yellow-500"
                                    : entry.category === "bonus"
                                      ? "border-green-500 text-green-500"
                                      : "border-muted-foreground text-muted-foreground"
                            }`}
                          >
                            {entry.category || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {entry.actionType || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {entry.poolDrawnFrom || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Transaction Ledger (Full Blockchain-Level Log) ── */}
      <TransactionLedgerPanel />

      {/* ── Pool Activity Log ── */}
      <Card
        className="bg-card border-border"
        data-ocid="treasury.pool_activity_card"
      >
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <button
              type="button"
              className="flex items-center gap-2 text-left"
              onClick={() => setActivityOpen((v) => !v)}
              data-ocid="treasury.pool_activity.toggle"
            >
              <Coins className="h-5 w-5 text-primary" />
              <CardTitle className="text-primary">Pool Activity Log</CardTitle>
              <span className="text-xs text-muted-foreground ml-1">
                {activityOpen ? "▲ collapse" : "▼ expand"}
              </span>
            </button>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <select
                  value={activityFilter}
                  onChange={(e) =>
                    setActivityFilter(
                      e.target.value as "all" | "earn" | "release" | "burn",
                    )
                  }
                  className="h-7 rounded border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  data-ocid="treasury.pool_activity.filter_select"
                >
                  <option value="all">All events</option>
                  <option value="earn">Earn only</option>
                  <option value="release">Releases only</option>
                  <option value="burn">Burns only</option>
                </select>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  runSchedules.mutate(undefined, {
                    onSuccess: (msg) => {
                      toast.success(
                        String(msg) || "Scheduled releases executed.",
                      );
                      queryClient.invalidateQueries({
                        queryKey: ["poolDetails"],
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["tokenSupply"],
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["emissionStats"],
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["poolActivityLog"],
                      });
                      void refetchPoolDetails();
                      void refetchSupply();
                    },
                    onError: (e) => toast.error(`Run failed: ${e.message}`),
                  })
                }
                disabled={runSchedules.isPending}
                data-ocid="treasury.pool_activity.run_schedules_button"
              >
                <Zap className="h-3.5 w-3.5 mr-1" />
                {runSchedules.isPending ? "Running…" : "Run Scheduled Now"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => void refetchPoolActivityLog()}
                data-ocid="treasury.pool_activity.refresh_button"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            All earn events, releases, burns, and buybacks from treasury pools.
          </p>
        </CardHeader>
        {activityOpen && (
          <CardContent className="p-0">
            {poolActivityLoading ? (
              <p className="text-muted-foreground text-sm px-6 py-4">
                Loading activity log…
              </p>
            ) : poolActivityError ? (
              <div className="px-6 py-4">
                <SectionError
                  label="Pool Activity Log"
                  onRetry={() => void refetchPoolActivityLog()}
                />
              </div>
            ) : !poolActivityLog || poolActivityLog.length === 0 ? (
              <p
                className="text-muted-foreground text-sm px-6 py-6 text-center"
                data-ocid="treasury.pool_activity.empty_state"
              >
                No pool activity recorded yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">
                        Time
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Pool
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Action
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Initiator
                      </TableHead>
                      <TableHead className="text-muted-foreground text-right">
                        Amount
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...poolActivityLog]
                      .filter((e) => {
                        if (activityFilter === "earn")
                          return e.action.includes("earn");
                        if (activityFilter === "release")
                          return e.action.includes("release");
                        if (activityFilter === "burn")
                          return (
                            e.action.includes("burn") ||
                            e.action.includes("buyback")
                          );
                        return true;
                      })
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .slice(0, 100)
                      .map((entry, i) => {
                        const isEarn = entry.action.includes("earn");
                        const isRelease = entry.action.includes("release");
                        const isBurn = entry.action.includes("burn");
                        const isBuyback = entry.action.includes("buyback");
                        const isTeam =
                          entry.action.includes("team") ||
                          entry.action.includes("payout");
                        const badgeClass = isEarn
                          ? "border-green-500 text-green-500"
                          : isRelease
                            ? "border-blue-400 text-blue-400"
                            : isBuyback
                              ? "border-orange-400 text-orange-400"
                              : isBurn
                                ? "border-destructive text-destructive"
                                : isTeam
                                  ? "border-purple-500 text-purple-500"
                                  : "border-muted-foreground text-muted-foreground";
                        return (
                          <TableRow
                            key={`act-${entry.timestamp}-${i}`}
                            className="border-border"
                            data-ocid={`treasury.pool_activity.item.${i + 1}`}
                          >
                            <TableCell className="text-xs text-foreground whitespace-nowrap">
                              {new Date(
                                entry.timestamp / 1_000_000,
                              ).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">
                              {entry.pool || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-xs capitalize ${badgeClass}`}
                              >
                                {entry.action.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-[140px]">
                              {entry.initiator
                                ? `${entry.initiator.slice(0, 12)}…`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-sm text-primary text-right font-mono font-semibold">
                              {formatMik97(entry.amount)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── Release Log (V2) ── */}
      <Card
        className="bg-card border-border"
        data-ocid="treasury.audit_log_card"
      >
        <CardHeader>
          <CardTitle className="text-primary">Release Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {auditLoading ? (
            <p className="text-muted-foreground text-sm px-6 py-4">
              Loading audit log…
            </p>
          ) : auditError ? (
            <div className="px-6 py-4">
              <SectionError
                label="Release Audit Log"
                onRetry={() => void refetchAudit()}
              />
            </div>
          ) : !auditLogV2 || auditLogV2.length === 0 ? (
            <p
              className="text-muted-foreground text-sm px-6 py-6 text-center"
              data-ocid="treasury.audit_log.empty_state"
            >
              No release events yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">
                      Time
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Pool
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right">
                      Amount
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Reason
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Triggered By
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...auditLogV2]
                    .sort((a, b) => Number(b.timestamp - a.timestamp))
                    .slice(0, 50)
                    .map((entry, i) => (
                      <TableRow
                        key={`${entry.id}-${i}`}
                        className="border-border"
                        data-ocid={`treasury.audit_log.item.${i + 1}`}
                      >
                        <TableCell className="text-sm text-foreground whitespace-nowrap">
                          {fmtDate(entry.timestamp)}
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
                          {entry.poolName}
                        </TableCell>
                        <TableCell className="text-sm text-foreground text-right font-mono">
                          {formatMik97(entry.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${reasonBadgeClass(entry.reason)}`}
                          >
                            {fmtReason(entry.reason)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-[140px]">
                          {entry.triggeredBy}
                        </TableCell>
                        <TableCell>
                          {entry.success ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-500">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              OK
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="flex items-center gap-1 text-xs text-destructive">
                                <XCircle className="h-3.5 w-3.5" />
                                Failed
                              </span>
                              {entry.errorMsg && (
                                <p
                                  className="text-xs text-destructive/80 max-w-[180px] truncate"
                                  title={entry.errorMsg}
                                >
                                  {entry.errorMsg}
                                </p>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Burn Statistics ── */}
      <Card
        className="bg-card border-border"
        data-ocid="treasury.burn_stats_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Burn Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {burnStatsLoading ? (
            <p className="text-muted-foreground text-sm">Loading burn data…</p>
          ) : burnStatsError ? (
            <SectionError
              label="Burn Statistics"
              onRetry={() => void refetchBurnStats()}
            />
          ) : !burnStats ? (
            <p
              className="text-muted-foreground text-sm text-center py-4"
              data-ocid="treasury.burn_stats.empty_state"
            >
              No burn data available.
            </p>
          ) : (
            <>
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Tokens Burned (All Time)
                  </p>
                  <p
                    className="text-3xl font-bold text-destructive font-mono mt-1"
                    data-ocid="treasury.burn_stats.total"
                  >
                    {formatMik97(burnStats.totalBurned)}
                  </p>
                </div>
              </div>

              {burnStats.burnByUseCase.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    Breakdown by Use Case
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {burnStats.burnByUseCase.map(([useCase, amount], i) => (
                      <div
                        key={useCase}
                        className="rounded-lg border border-border bg-muted/20 px-3 py-3 text-center"
                        data-ocid={`treasury.burn_stats.usecase.${i + 1}`}
                      >
                        <p className="text-xs text-muted-foreground capitalize mb-1">
                          {useCase.replace(/([A-Z])/g, " $1").trim()}
                        </p>
                        <p className="text-lg font-bold text-foreground font-mono">
                          {formatMik97(Number(amount))}
                        </p>
                        <p className="text-xs text-muted-foreground">MIK97</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  Recent Burns
                </h4>
                {burnStats.recentBurns.length === 0 ? (
                  <p
                    className="text-muted-foreground text-sm text-center py-3"
                    data-ocid="treasury.recent_burns.empty_state"
                  >
                    No burn events yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead className="text-muted-foreground">
                            Time
                          </TableHead>
                          <TableHead className="text-muted-foreground">
                            User
                          </TableHead>
                          <TableHead className="text-muted-foreground text-right">
                            Amount
                          </TableHead>
                          <TableHead className="text-muted-foreground">
                            Use Case
                          </TableHead>
                          <TableHead className="text-muted-foreground">
                            Beat ID
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...burnStats.recentBurns]
                          .sort((a, b) => Number(b.timestamp - a.timestamp))
                          .slice(0, 50)
                          .map((burn, i) => (
                            <TableRow
                              key={`${burn.timestamp}-${i}`}
                              className="border-border"
                              data-ocid={`treasury.recent_burns.item.${i + 1}`}
                            >
                              <TableCell className="text-sm text-foreground whitespace-nowrap">
                                {new Date(
                                  Number(burn.timestamp) / 1_000_000,
                                ).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                                {burn.user.toString().slice(0, 12)}…
                              </TableCell>
                              <TableCell className="text-sm text-destructive text-right font-mono">
                                {formatMik97(Number(burn.amount))}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="text-xs border-destructive/40 text-destructive capitalize"
                                >
                                  {burn.useCase}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-[100px]">
                                {burn.beatId ?? "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Migration & On-Chain Controls ── */}
      <div data-ocid="treasury.migration_section">
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-primary" />
          Migration &amp; On-Chain Controls
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Card
            className="bg-card border-border"
            data-ocid="treasury.migration.token_name"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Token Name
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-foreground font-mono">
                {icrc1Info?.name ?? "MIK97"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Symbol: {icrc1Info?.symbol ?? "MIK97"}
              </p>
            </CardContent>
          </Card>

          <Card
            className="bg-card border-border"
            data-ocid="treasury.migration.decimals"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Decimals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-foreground font-mono">
                {icrc1Info?.decimals ?? 8}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ICRC-1 Standard
              </p>
            </CardContent>
          </Card>

          <Card
            className="bg-card border-border"
            data-ocid="treasury.migration.total_supply"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total Supply
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-foreground font-mono">
                {icrc1Info
                  ? Math.round(
                      Number(icrc1Info.totalSupply) / 100_000_000,
                    ).toLocaleString()
                  : "100,000,000"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Initial:{" "}
                {icrc1Info
                  ? Math.round(
                      Number(icrc1Info.initialCirculating) / 100_000_000,
                    ).toLocaleString()
                  : "10,000,000"}
              </p>
            </CardContent>
          </Card>

          <Card
            className="bg-card border-border"
            data-ocid="treasury.migration.ownership_status"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Ownership
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {ownershipRenounced ? (
                  <ShieldOff className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <Lock className="h-4 w-4 text-primary shrink-0" />
                )}
                <p className="text-sm font-semibold text-foreground">
                  {ownershipRenounced ? "Renounced" : "Admin Controlled"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {ownershipRenounced
                  ? "Fully Decentralized"
                  : "You hold ownership"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card
          className="bg-card border-border mb-4"
          data-ocid="treasury.migration.status_card"
        >
          <CardContent className="pt-5 pb-5 space-y-3">
            <div className="flex items-center gap-3">
              {migrationCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              ) : (
                <ArrowRightLeft className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Migration Status:{" "}
                  <span
                    className={
                      migrationCompleted
                        ? "text-green-500"
                        : "text-muted-foreground"
                    }
                  >
                    {migrationCompleted
                      ? `Completed${Array.isArray(migrationLog) && migrationLog.length > 0 ? ` on ${new Date(Number(migrationLog[migrationLog.length - 1].timestamp) / 1_000_000).toLocaleDateString()}` : ""}`
                      : "Not yet migrated"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {ownershipRenounced ? (
                <ShieldOff className="h-5 w-5 text-green-500 shrink-0" />
              ) : (
                <Lock className="h-5 w-5 text-primary shrink-0" />
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Ownership Status:{" "}
                  <span
                    className={
                      ownershipRenounced ? "text-green-500" : "text-primary"
                    }
                  >
                    {ownershipRenounced
                      ? "Ownership Renounced (Fully Decentralized)"
                      : "Admin Controlled"}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 mt-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                The MIK97 ICRC-1 token contract is deployed and ready. The
                platform currently runs on the internal token system. Press{" "}
                <strong className="text-foreground">Migrate to On-Chain</strong>{" "}
                to transfer all user balances on-chain and switch to the live
                token contract.
              </p>
            </div>
          </CardContent>
        </Card>

        <div
          className="flex flex-col sm:flex-row gap-3"
          data-ocid="treasury.migration.actions"
        >
          <Button
            onClick={() => {
              setMigratePhrase("");
              setShowMigrateModal(true);
            }}
            disabled={!!migrationCompleted || !!ownershipRenounced}
            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            data-ocid="treasury.migration.migrate_button"
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Migrate to On-Chain
          </Button>
          <Button
            onClick={() => {
              setRenouncePhrase("");
              setShowRenounceModal(true);
            }}
            disabled={!migrationCompleted || !!ownershipRenounced}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-40"
            data-ocid="treasury.migration.renounce_button"
          >
            <ShieldOff className="h-4 w-4 mr-2" />
            Renounce Ownership
          </Button>
        </div>

        {Array.isArray(migrationLog) && migrationLog.length > 0 && (
          <Card
            className="bg-card border-border mt-4"
            data-ocid="treasury.migration.log_card"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">
                Migration Log
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">
                        Time
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Users Migrated
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Tokens Distributed
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...(migrationLog as MigrationLogEntry[])]
                      .sort((a, b) => Number(b.timestamp - a.timestamp))
                      .map((entry, i) => (
                        <TableRow
                          key={`${entry.timestamp}-${i}`}
                          className="border-border"
                          data-ocid={`treasury.migration.log.item.${i + 1}`}
                        >
                          <TableCell className="text-sm text-foreground whitespace-nowrap">
                            {new Date(
                              Number(entry.timestamp) / 1_000_000,
                            ).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-foreground font-semibold">
                            {Number(entry.totalUsers).toLocaleString()} users
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {Number(
                              entry.totalTokensDistributed,
                            ).toLocaleString()}{" "}
                            MIK97
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Active Wallets Info ── */}
      {walletCount !== null && (
        <Card
          className="bg-card border-border"
          data-ocid="treasury.supply.wallets"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Active Wallets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground font-mono">
              {Number(walletCount).toLocaleString()}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <Users className="h-3 w-3 text-primary" />
              <span className="text-xs text-muted-foreground">
                users with MIK97 wallets
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Migrate Modal ── */}
      {showMigrateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          data-ocid="treasury.migration.migrate_dialog"
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <ArrowRightLeft className="h-6 w-6 text-primary shrink-0" />
              <h2 className="text-lg font-bold text-foreground">
                Migrate MIK97 to On-Chain
              </h2>
            </div>
            <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3">
              <p className="text-sm text-yellow-400 leading-relaxed">
                This will read every user's current MIK97 balance and distribute
                matching ICRC-1 tokens to their Internet Identity wallets. The
                platform will be briefly paused during migration.
              </p>
            </div>
            {initiateMigration.isPending ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground font-medium">
                  Migration in progress… do not close this window
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">
                    Type <strong className="text-primary">MIGRATE NOW</strong>{" "}
                    to confirm
                  </Label>
                  <Input
                    value={migratePhrase}
                    onChange={(e) => setMigratePhrase(e.target.value)}
                    placeholder="MIGRATE NOW"
                    className="bg-background border-input font-mono"
                    data-ocid="treasury.migration.migrate_phrase_input"
                    autoComplete="off"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <Button
                    variant="outline"
                    className="flex-1 border-border text-foreground"
                    onClick={() => setShowMigrateModal(false)}
                    data-ocid="treasury.migration.migrate_cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
                    disabled={migratePhrase !== "MIGRATE NOW"}
                    onClick={() => {
                      initiateMigration.mutate(undefined, {
                        onSuccess: () => {
                          toast.success(
                            "Migration completed successfully! All user balances are now on-chain.",
                          );
                          setShowMigrateModal(false);
                        },
                        onError: (e) => {
                          toast.error(`Migration failed: ${e.message}`);
                        },
                      });
                    }}
                    data-ocid="treasury.migration.migrate_confirm_button"
                  >
                    Confirm Migration
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Renounce Modal ── */}
      {showRenounceModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          data-ocid="treasury.migration.renounce_dialog"
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="rounded-lg border border-destructive bg-destructive/15 px-4 py-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-destructive">
                ⚠️ THIS ACTION IS PERMANENT AND CANNOT BE UNDONE
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ShieldOff className="h-6 w-6 text-destructive shrink-0" />
              <h2 className="text-lg font-bold text-foreground">
                Renounce Token Ownership
              </h2>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">
                Type{" "}
                <strong className="text-destructive">RENOUNCE OWNERSHIP</strong>{" "}
                to confirm
              </Label>
              <Input
                value={renouncePhrase}
                onChange={(e) => setRenouncePhrase(e.target.value)}
                placeholder="RENOUNCE OWNERSHIP"
                className="bg-background border-input font-mono"
                data-ocid="treasury.migration.renounce_phrase_input"
                autoComplete="off"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1 border-border text-foreground"
                onClick={() => setShowRenounceModal(false)}
                data-ocid="treasury.migration.renounce_cancel_button"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-40"
                disabled={
                  renouncePhrase !== "RENOUNCE OWNERSHIP" ||
                  renounceOwnership.isPending
                }
                onClick={() => {
                  renounceOwnership.mutate(undefined, {
                    onSuccess: () => {
                      toast.success(
                        "Ownership successfully renounced. MIK97 is now fully decentralized.",
                      );
                      setShowRenounceModal(false);
                    },
                    onError: (e) => {
                      toast.error(`Renounce failed: ${e.message}`);
                    },
                  });
                }}
                data-ocid="treasury.migration.renounce_confirm_button"
              >
                {renounceOwnership.isPending
                  ? "Processing…"
                  : "Confirm Renounce"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminTreasuryPanel() {
  return (
    <ErrorBoundary sectionLabel="Treasury Panel">
      <AdminTreasuryPanelInner />
    </ErrorBoundary>
  );
}
