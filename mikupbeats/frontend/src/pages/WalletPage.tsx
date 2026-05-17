import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  Clipboard,
  Clock,
  Coins,
  Flame,
  Gamepad2,
  Gift,
  Info,
  Lock,
  LogIn,
  Music,
  Radio,
  ShoppingBag,
  Star,
  Target,
  TrendingUp,
  Unlock,
  Upload,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  EarnCategory,
  SpendUseCase,
  type StakeRecord,
  type StakingConfig,
} from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useClaimDailyLoginBonus,
  useClaimStakingRewards,
  useCreateOrGetWallet,
  useDailyCapStatus,
  useDailyLoginStatus,
  useGetAccruedRewards,
  useGetBonusEarningConfig,
  useGetDailyCapConfig,
  useGetForumRewardConfig,
  useGetFundingMilestone,
  useGetMixtapeRewardConfig,
  useGetMyDailyEarnings,
  useGetMyDailyEarningsByCategory,
  useGetMyPoLBadges,
  useGetMyPoLSessions,
  useGetMyStakes,
  useGetPlatformToggles,
  useGetPoLConfig,
  useGetRewardRateConfig,
  useGetStakingConfig,
  useGetStakingPenaltyConfig,
  useIsCallerAdmin,
  useStakeTokens,
  useUnstake,
  useUserWallet,
} from "../hooks/useQueries";
import type { BadgeTier } from "../types/pol";
import { formatMIK97 } from "../utils/formatTokenAmount";

import PoLBadge from "../components/PoLBadge";

/** Format a plain backend token amount — backend stores plain Nat, no ×1e8 factor. */
function formatAmount(raw: number): string {
  return formatMIK97(raw);
}

function formatTimestamp(ts: bigint | number): string {
  const ms = typeof ts === "bigint" ? Number(ts) / 1_000_000 : ts;
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function earnCategoryLabel(cat: EarnCategory): string {
  if (cat === EarnCategory.games) return "Games";
  if (cat === EarnCategory.music) return "Music";
  if (cat === EarnCategory.live) return "Live";
  return "Bonus";
}

function earnCategoryColor(cat: EarnCategory): string {
  if (cat === EarnCategory.games)
    return "bg-primary/20 text-primary border-primary/30";
  if (cat === EarnCategory.music)
    return "bg-accent/20 text-accent border-accent/30";
  if (cat === EarnCategory.live)
    return "bg-destructive/20 text-destructive border-destructive/30";
  return "bg-muted text-muted-foreground border-border";
}

function spendUseCaseLabel(useCase: SpendUseCase): string {
  if (useCase === SpendUseCase.beatDiscount) return "Beat Discount";
  if (useCase === SpendUseCase.showcaseEntry) return "Showcase Entry";
  if (useCase === SpendUseCase.mixtapeDrop) return "Mixtape Drop";
  return "Premium Content";
}

/** Maps raw backend game-type tokens in earn description to friendly game names. */
function formatEarnDescription(desc: string | null | undefined): string {
  if (!desc) return "";
  // Replace standalone 'dino' (case-insensitive) with 'Jumper'
  // Replace standalone 'flappy' (case-insensitive) with 'Flappy'
  return desc.replace(/\bdino\b/gi, "Jumper").replace(/\bflappy\b/gi, "Flappy");
}

// ── Staking Section Components ──────────────────────────────────────────────

function StakeRowCard({ stake }: { stake: StakeRecord }) {
  const { data: accrued = 0, isLoading: accruedLoading } = useGetAccruedRewards(
    stake.id,
  );
  const { data: penaltyConfig } = useGetStakingPenaltyConfig();
  const claimRewards = useClaimStakingRewards();
  const unstakeMut = useUnstake();
  const [showUnstakeConfirm, setShowUnstakeConfirm] = useState(false);
  const [unstakeResult, setUnstakeResult] = useState<{
    principal: number;
    rewardsPaid: number;
    penaltyCharged: number;
    penaltyBurned: number;
    penaltyToRewards: number;
  } | null>(null);

  const now = Date.now() * 1_000_000;
  const lockEnd = Number(stake.lockEndTime);
  const lockStart = Number(stake.startTime ?? 0); // nanoseconds
  const isLocked = now < lockEnd;
  const msRemaining = isLocked ? (lockEnd - now) / 1_000_000 : 0;
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  const amountStaked = Number(stake.amountStaked) / 1e8;

  // Days already staked (used for tiered sliding penalty)
  const msStaked =
    lockStart > 0 ? Math.max(0, now / 1_000_000 - lockStart / 1_000_000) : 0;
  const daysStaked = Math.floor(msStaked / (1000 * 60 * 60 * 24));

  // Tiered sliding penalty — computed client-side per requirements:
  //   30-day lock:  penalty = max(1, 30 - daysStaked)
  //   90-day lock:  penalty = max(1, 30 - floor(daysStaked/3))
  //   180-day lock: penalty = max(1, 30 - floor(daysStaked/6))
  const lockDays = Number(stake.lockDays);
  const slidingPenaltyPct = (() => {
    if (!isLocked) return 0;
    if (lockDays <= 30) return Math.max(1, 30 - daysStaked);
    if (lockDays <= 90) return Math.max(1, 30 - Math.floor(daysStaked / 3));
    return Math.max(1, 30 - Math.floor(daysStaked / 6));
  })();

  // Penalty split percentages
  const burnPct = penaltyConfig?.earlyUnstakeBurnPercent ?? 50;
  const rewardsPct = penaltyConfig?.earlyUnstakeRewardsPercent ?? 50;

  // Only show penalty if locks are still active AND admin has enabled the penalty system
  const penaltyEnabled =
    isLocked && (penaltyConfig?.earlyUnstakePenaltyEnabled ?? false);
  // Use sliding tier-based % instead of flat admin %
  const effectivePenaltyPct = penaltyEnabled ? slidingPenaltyPct : 0;
  const penaltyAmount = penaltyEnabled
    ? (amountStaked * effectivePenaltyPct) / 100
    : 0;
  const principalReturned = amountStaked - penaltyAmount;
  const penaltyBurnAmt = (penaltyAmount * burnPct) / 100;
  const penaltyRewardsAmt = (penaltyAmount * rewardsPct) / 100;

  const handleClaim = () => {
    claimRewards.mutate(stake.id, {
      onSuccess: (tokens) =>
        toast.success(
          `Claimed ${formatMIK97(Number(tokens))} MIK97 in rewards!`,
        ),
      onError: (e: Error) => toast.error(e.message || "Claim failed"),
    });
  };

  const handleUnstake = () => {
    unstakeMut.mutate(stake.id, {
      onSuccess: (res) => {
        const result = {
          principal: res.principalReturned,
          rewardsPaid: res.rewardsPaid,
          penaltyCharged: penaltyAmount,
          penaltyBurned: penaltyBurnAmt,
          penaltyToRewards: penaltyRewardsAmt,
        };
        setUnstakeResult(result);
        setShowUnstakeConfirm(false);
        if (penaltyAmount > 0) {
          toast.success(
            `Unstaked! Received ${formatMIK97(res.principalReturned)} MIK97 principal + ${formatMIK97(res.rewardsPaid)} MIK97 rewards. Penalty: ${formatMIK97(penaltyAmount)} MIK97 (${formatMIK97(penaltyBurnAmt)} burned, ${formatMIK97(penaltyRewardsAmt)} to pool)`,
            { duration: 6000 },
          );
        } else {
          toast.success(
            `Unstaked! Received ${formatMIK97(res.principalReturned)} MIK97 + ${formatMIK97(res.rewardsPaid)} MIK97 rewards`,
          );
        }
      },
      onError: (e: Error) => {
        toast.error(e.message || "Unstake failed");
        setShowUnstakeConfirm(false);
      },
    });
  };

  if (unstakeResult) {
    return (
      <div
        className="rounded-lg border border-green-500/30 bg-green-500/5 p-4 space-y-3"
        data-ocid="wallet.staking.unstake_result"
      >
        <p className="text-sm font-bold text-green-400 flex items-center gap-2">
          <Unlock className="h-4 w-4" />
          Unstake Complete
        </p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Principal returned</span>
            <span className="font-bold text-foreground">
              {formatMIK97(unstakeResult.principal)} MIK97
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rewards paid</span>
            <span className="font-bold text-primary">
              {formatMIK97(unstakeResult.rewardsPaid)} MIK97
            </span>
          </div>
          {unstakeResult.penaltyCharged > 0 && (
            <>
              <div className="border-t border-border pt-1 mt-1" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Penalty charged</span>
                <span className="text-destructive font-semibold">
                  -{formatMIK97(unstakeResult.penaltyCharged)} MIK97
                </span>
              </div>
              <div className="flex justify-between pl-3">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Flame className="h-3 w-3" /> Burned
                </span>
                <span className="text-destructive">
                  {formatMIK97(unstakeResult.penaltyBurned)} MIK97
                </span>
              </div>
              <div className="flex justify-between pl-3">
                <span className="text-muted-foreground">To Rewards Pool</span>
                <span className="text-foreground">
                  {formatMIK97(unstakeResult.penaltyToRewards)} MIK97
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-border bg-muted/20 p-4 space-y-3"
      data-ocid="wallet.staking.active_stake"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isLocked ? (
            <Lock className="h-4 w-4 text-primary shrink-0" />
          ) : (
            <Unlock className="h-4 w-4 text-green-500 shrink-0" />
          )}
          <span className="text-sm font-bold text-foreground">
            {formatMIK97(amountStaked)} MIK97
          </span>
          <span className="text-xs text-muted-foreground">staked</span>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-primary">
            {stake.apyAtStake}% APY
          </p>
          <p className="text-xs text-muted-foreground">
            {Number(stake.lockDays)}-day lock
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-card rounded px-2.5 py-1.5 border border-border">
          <p className="text-muted-foreground">Accrued Rewards</p>
          <p className="font-bold text-primary">
            {accruedLoading ? "…" : `${formatMIK97(accrued)} MIK97`}
          </p>
        </div>
        <div className="bg-card rounded px-2.5 py-1.5 border border-border">
          <p className="text-muted-foreground">
            {isLocked ? "Unlocks In" : "Status"}
          </p>
          <p
            className={`font-bold ${
              isLocked ? "text-foreground" : "text-green-500"
            }`}
          >
            {isLocked ? `${daysRemaining}d remaining` : "Unlocked"}
          </p>
        </div>
      </div>

      {/* Early exit penalty indicator — always visible when lock is active */}
      {isLocked && penaltyEnabled && (
        <div className="rounded bg-destructive/5 border border-destructive/20 px-2.5 py-1.5 text-xs flex items-center justify-between">
          <span className="text-muted-foreground">Early exit penalty</span>
          <span className="font-bold text-destructive">
            {effectivePenaltyPct}%
          </span>
        </div>
      )}

      {!showUnstakeConfirm ? (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            className="flex-1 h-8 text-xs"
            disabled={claimRewards.isPending || accrued <= 0}
            onClick={handleClaim}
            data-ocid="wallet.staking.claim_button"
          >
            {claimRewards.isPending
              ? "Claiming…"
              : `Claim ${formatMIK97(accrued)} MIK97`}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
            disabled={unstakeMut.isPending}
            onClick={() => setShowUnstakeConfirm(true)}
            data-ocid="wallet.staking.unstake_button"
          >
            {isLocked ? "Early Unstake" : "Unstake"}
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="text-xs text-foreground leading-relaxed space-y-2">
              {isLocked ? (
                <>
                  <p>
                    <span className="font-bold">Early unstake warning:</span>{" "}
                    You will receive prorated rewards based on time elapsed.
                  </p>
                  {penaltyEnabled ? (
                    <div className="rounded bg-card border border-border p-2.5 space-y-1">
                      <p className="font-semibold text-foreground text-xs mb-1.5">
                        Breakdown:
                      </p>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Principal returned
                        </span>
                        <span className="font-bold text-foreground">
                          {formatMIK97(principalReturned)} MIK97
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Penalty charged ({effectivePenaltyPct}% — day{" "}
                          {daysStaked} of {lockDays})
                        </span>
                        <span className="text-destructive font-semibold">
                          -{formatMIK97(penaltyAmount)} MIK97
                        </span>
                      </div>
                      <div className="flex justify-between pl-3">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          Burned ({burnPct}%)
                        </span>
                        <span className="text-destructive text-xs">
                          {formatMIK97(penaltyBurnAmt)} MIK97
                        </span>
                      </div>
                      <div className="flex justify-between pl-3">
                        <span className="text-muted-foreground">
                          Back to Rewards Pool ({rewardsPct}%)
                        </span>
                        <span className="text-foreground text-xs">
                          {formatMIK97(penaltyRewardsAmt)} MIK97
                        </span>
                      </div>
                      {accrued > 0 && (
                        <div className="flex justify-between border-t border-border pt-1">
                          <span className="text-muted-foreground">
                            Rewards earned
                          </span>
                          <span className="font-bold text-primary">
                            {formatMIK97(accrued)} MIK97
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    accrued > 0 && (
                      <span>
                        Current accrued:{" "}
                        <span className="font-bold text-primary">
                          {formatMIK97(accrued)} MIK97
                        </span>
                        .
                      </span>
                    )
                  )}
                </>
              ) : (
                <>
                  You will receive your full principal and all accrued rewards.
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-xs"
              onClick={() => setShowUnstakeConfirm(false)}
              data-ocid="wallet.staking.cancel_button"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1 h-7 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={unstakeMut.isPending}
              onClick={handleUnstake}
              data-ocid="wallet.staking.confirm_button"
            >
              {unstakeMut.isPending ? "Unstaking…" : "Confirm Unstake"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StakingSection({
  walletBalance,
  stakingConfig,
}: {
  walletBalance: number;
  stakingConfig: StakingConfig;
}) {
  const [amount, setAmount] = useState("");
  const [lockDays, setLockDays] = useState<30 | 90 | 180>(30);
  const { data: activeStakes = [], isLoading: stakesLoading } =
    useGetMyStakes();
  const stakeTokens = useStakeTokens();

  const tiers: { days: 30 | 90 | 180; apy: number; label: string }[] = [
    { days: 30, apy: stakingConfig.tier1Apy, label: "30 Days" },
    { days: 90, apy: stakingConfig.tier2Apy, label: "90 Days" },
    { days: 180, apy: stakingConfig.tier3Apy, label: "180 Days" },
  ];
  const selectedTier = tiers.find((t) => t.days === lockDays) ?? tiers[0];
  const amountNum = Number.parseFloat(amount) || 0;
  const entryFee = stakingConfig.entryFeeEnabled
    ? (amountNum * stakingConfig.entryFeePercent) / 100
    : 0;
  const netStaked = amountNum - entryFee;
  const projectedAnnual = netStaked * (selectedTier.apy / 100);
  const projectedForPeriod = (projectedAnnual / 365) * lockDays;

  const canStake =
    amountNum >= stakingConfig.minStake &&
    amountNum <= stakingConfig.maxStake &&
    amountNum <= walletBalance;

  const handleStake = () => {
    stakeTokens.mutate(
      { amountFloat: amountNum, lockDays: BigInt(lockDays) },
      {
        onSuccess: (result) => {
          toast.success(
            `Staked ${formatMIK97(result.amountStaked)} MIK97 for ${result.lockDays} days at ${result.apy}% APY!`,
          );
          setAmount("");
        },
        onError: (e: Error) => toast.error(e.message || "Stake failed"),
      },
    );
  };

  const myActiveStakes = activeStakes.filter((s) => s.isActive);

  return (
    <div className="space-y-4">
      {/* Stake Form */}
      <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          New Stake
        </p>

        {/* Lock tier selector */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Lock Period &amp; APY</p>
          <div className="grid grid-cols-3 gap-2">
            {tiers.map((tier) => (
              <button
                key={tier.days}
                type="button"
                onClick={() => setLockDays(tier.days)}
                data-ocid={`wallet.staking.tier_${tier.days}_button`}
                className={`rounded-lg border px-2 py-2.5 text-center transition-colors ${
                  lockDays === tier.days
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/50"
                }`}
              >
                <p className="text-xs font-bold">{tier.label}</p>
                <p className="text-sm font-black text-primary">
                  {tier.apy}% APY
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Amount input */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <p className="text-xs text-muted-foreground">Amount (MIK97)</p>
            <p className="text-xs text-muted-foreground">
              Min: {formatMIK97(stakingConfig.minStake)} · Max:{" "}
              {formatMIK97(stakingConfig.maxStake)}
            </p>
          </div>
          <div className="relative">
            <input
              type="number"
              min={stakingConfig.minStake}
              max={Math.min(stakingConfig.maxStake, walletBalance)}
              step="0.00000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min ${formatMIK97(stakingConfig.minStake)}`}
              data-ocid="wallet.staking.amount_input"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="button"
              onClick={() =>
                setAmount(
                  String(Math.min(stakingConfig.maxStake, walletBalance)),
                )
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary hover:underline"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Entry fee + projection */}
        {amountNum > 0 && (
          <div className="rounded-lg bg-card border border-border p-3 space-y-1.5 text-xs">
            {stakingConfig.entryFeeEnabled && entryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Entry fee ({stakingConfig.entryFeePercent}%)
                </span>
                <span className="text-destructive">
                  −{formatMIK97(entryFee)} MIK97
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Net staked</span>
              <span className="font-medium text-foreground">
                {formatMIK97(netStaked)} MIK97
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-1.5">
              <span className="text-muted-foreground">
                Projected rewards ({lockDays}d)
              </span>
              <span className="font-bold text-primary">
                +{formatMIK97(projectedForPeriod)} MIK97
              </span>
            </div>
          </div>
        )}

        <Button
          className="w-full"
          disabled={!canStake || stakeTokens.isPending}
          onClick={handleStake}
          data-ocid="wallet.staking.stake_button"
        >
          {stakeTokens.isPending
            ? "Staking…"
            : amountNum <= 0
              ? `Stake MIK97 — ${selectedTier.apy}% APY`
              : `Stake ${formatMIK97(amountNum)} MIK97`}
        </Button>
        {amountNum > 0 && !canStake && (
          <p className="text-xs text-destructive text-center">
            {amountNum > walletBalance
              ? "Insufficient balance"
              : amountNum < stakingConfig.minStake
                ? `Minimum stake is ${formatMIK97(stakingConfig.minStake)} MIK97`
                : `Maximum stake is ${formatMIK97(stakingConfig.maxStake)} MIK97`}
          </p>
        )}
      </div>

      {/* Active stakes */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Active Stakes
          {myActiveStakes.length > 0 ? ` (${myActiveStakes.length})` : ""}
        </p>
        {stakesLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : myActiveStakes.length === 0 ? (
          <div
            data-ocid="wallet.staking.empty_state"
            className="text-center py-8 rounded-lg border border-border bg-muted/10"
          >
            <Lock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No active stakes yet
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Stake above to start earning APY rewards
            </p>
          </div>
        ) : (
          myActiveStakes.map((stake, i) => (
            <div
              key={stake.id}
              data-ocid={`wallet.staking.stake.item.${i + 1}`}
            >
              <StakeRowCard stake={stake} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ProgressBar({
  value,
  max,
  label,
}: { value: number; max: number; label: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className="text-foreground font-medium">{label}</span>
        <span className="text-muted-foreground">
          {formatMIK97(value)} / {formatMIK97(max)} MIK97
        </span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function DailyBonusCard({
  loginBonusTokens,
  streakBonusTokens,
  streakTarget,
}: {
  loginBonusTokens: number;
  streakBonusTokens: number;
  streakTarget: number;
}) {
  const { data: loginStatus, isLoading } = useDailyLoginStatus();
  const claimBonus = useClaimDailyLoginBonus();

  const streak = loginStatus ? Number(loginStatus.loginStreak) : 0;
  const canClaim = loginStatus?.canClaimBonus ?? false;
  const daysUntilStreak = streakTarget - (streak % streakTarget);
  const isStreakMilestone = streak > 0 && streak % streakTarget === 0;

  const handleClaim = () => {
    claimBonus.mutate(undefined, {
      onSuccess: (data) => {
        const earned = Number(data.tokensEarned);
        toast.success(`Daily Login Bonus claimed! +${earned} MIK97`, {
          duration: 4000,
        });
        if (data.streakBonusEarned) {
          setTimeout(() => {
            toast.success(
              `🔥 ${streakTarget}-Day Streak Bonus! +${streakBonusTokens} MIK97`,
              {
                duration: 5000,
              },
            );
          }, 800);
        }
      },
      onError: (err: Error) =>
        toast.error(err.message || "Failed to claim bonus"),
    });
  };

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  return (
    <Card
      data-ocid="wallet.daily_bonus.card"
      className="bg-card border-primary/30"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" />
          Daily Bonus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          {/* Streak display */}
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {streak > 0 ? `${streak} day streak` : "No streak yet"}
              </p>
              {isStreakMilestone ? (
                <p className="text-xs text-primary font-semibold">
                  🎉 Streak milestone reached!
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {daysUntilStreak === streakTarget
                    ? "Start your streak today"
                    : `${daysUntilStreak} more day${daysUntilStreak !== 1 ? "s" : ""} for +${streakBonusTokens} MIK97 streak bonus`}
                </p>
              )}
            </div>
          </div>

          {/* Claim button */}
          <Button
            data-ocid="wallet.daily_bonus.claim_button"
            size="sm"
            variant={canClaim ? "default" : "secondary"}
            disabled={!canClaim || claimBonus.isPending}
            onClick={handleClaim}
            className="shrink-0"
          >
            {claimBonus.isPending
              ? "Claiming…"
              : canClaim
                ? `Claim +${loginBonusTokens} MIK97`
                : "Come back tomorrow!"}
          </Button>
        </div>

        {/* Streak progress dots */}
        {streak > 0 && (
          <div className="flex gap-1.5 pt-1">
            {Array.from({ length: streakTarget }, (_, idx) => idx + 1).map(
              (day) => (
                <div
                  key={`streak-day-${day}`}
                  className={`h-2 flex-1 rounded-full ${
                    day <= streak % streakTarget ||
                    (streak % streakTarget === 0 && day <= streakTarget)
                      ? "bg-primary"
                      : "bg-secondary"
                  }`}
                />
              ),
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── PoL Verified Listener Badges Section ────────────────────────────────────────

const BADGE_TIER_COLORS: Record<
  BadgeTier,
  { label: string; hex: string; bg: string; border: string }
> = {
  bronze: {
    label: "Bronze Listener",
    hex: "#CD7F32",
    bg: "bg-[#2a1a0a]",
    border: "border-[#CD7F32]/40",
  },
  silver: {
    label: "Silver Listener",
    hex: "#C0C0C0",
    bg: "bg-[#1a1a1a]",
    border: "border-[#C0C0C0]/40",
  },
  gold: {
    label: "Gold Listener",
    hex: "#FFD700",
    bg: "bg-[#1a1500]",
    border: "border-[#FFD700]/40",
  },
};

function ConfidenceBar({ score }: { score: number }) {
  const color =
    score >= 67
      ? "bg-green-500"
      : score >= 34
        ? "bg-yellow-500"
        : "bg-destructive";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span
        className={`text-xs font-bold tabular-nums shrink-0 ${
          score >= 67
            ? "text-green-500"
            : score >= 34
              ? "text-yellow-500"
              : "text-destructive"
        }`}
      >
        {score}%
      </span>
    </div>
  );
}

function PoLBadgesSection() {
  const { data: badges = [], isLoading: badgesLoading } = useGetMyPoLBadges();
  const { data: sessions = [], isLoading: sessionsLoading } =
    useGetMyPoLSessions(10);
  const { data: polConfig } = useGetPoLConfig();

  const bronzeThreshold = polConfig?.bronzeThreshold ?? 1;
  const silverThreshold = polConfig?.silverThreshold ?? 34;
  const goldThreshold = polConfig?.goldThreshold ?? 67;

  // Average confidence across recent sessions
  const avgConfidence =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((sum, s) => sum + s.confidenceScore, 0) /
            sessions.length,
        )
      : 0;

  const highestTier = badges.some((b) => b.tier === "gold")
    ? "gold"
    : badges.some((b) => b.tier === "silver")
      ? "silver"
      : badges.some((b) => b.tier === "bronze")
        ? "bronze"
        : null;

  const nextTier: BadgeTier | null =
    highestTier === "gold"
      ? null
      : highestTier === "silver"
        ? "gold"
        : highestTier === "bronze"
          ? "silver"
          : "bronze";

  const nextTierThreshold =
    nextTier === "gold"
      ? goldThreshold
      : nextTier === "silver"
        ? silverThreshold
        : bronzeThreshold;

  return (
    <Card className="bg-card border-border" data-ocid="wallet.pol_badges.card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="text-lg">♪</span>
          Verified Listener Badges
          {highestTier && (
            <span className="ml-auto">
              <PoLBadge tier={highestTier as BadgeTier} size="sm" showLabel />
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Badge tier progress info */}
        <div className="rounded-lg bg-muted/20 border border-border px-3 py-2 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Tier Thresholds
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(["bronze", "silver", "gold"] as BadgeTier[]).map((tier) => {
              const cfg = BADGE_TIER_COLORS[tier];
              const threshold =
                tier === "bronze"
                  ? bronzeThreshold
                  : tier === "silver"
                    ? silverThreshold
                    : goldThreshold;
              const earned = badges.some((b) => b.tier === tier);
              return (
                <div
                  key={tier}
                  className={`rounded border p-2 text-center ${
                    earned
                      ? `${cfg.bg} ${cfg.border}`
                      : "bg-muted/10 border-border"
                  }`}
                  data-ocid={`wallet.pol_badges.${tier}_tier`}
                >
                  <PoLBadge tier={tier} size="md" />
                  <p
                    className="text-xs font-bold mt-1"
                    style={earned ? { color: cfg.hex } : {}}
                  >
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {threshold}%+ confidence
                  </p>
                  {earned && (
                    <p
                      className="text-[10px] font-semibold mt-0.5"
                      style={{ color: cfg.hex }}
                    >
                      Earned ✓
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Badges list */}
        {badgesLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : badges.length === 0 ? (
          <div
            data-ocid="wallet.pol_badges.empty_state"
            className="text-center py-6 space-y-2"
          >
            <span className="text-4xl">♪</span>
            <p className="text-sm text-muted-foreground">
              Start listening to earn your Verified Listener badge
            </p>
            <p className="text-xs text-muted-foreground/70">
              Play beats and showcase tracks to build your confidence score
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {badges.map((badge, i) => {
              const cfg = BADGE_TIER_COLORS[badge.tier];
              return (
                <div
                  key={`badge-${badge.tier}-${badge.earnedAt}`}
                  className={`rounded-lg border p-3 flex items-center gap-3 ${cfg.bg} ${cfg.border}`}
                  data-ocid={`wallet.pol_badges.badge.item.${i + 1}`}
                >
                  <PoLBadge tier={badge.tier} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold" style={{ color: cfg.hex }}>
                      {cfg.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Earned{" "}
                      {new Date(badge.earnedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Unlocked at {badge.confidenceAtEarning}% confidence
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className="text-xs font-semibold px-1.5 py-0.5 rounded border"
                      style={{ color: cfg.hex, borderColor: `${cfg.hex}40` }}
                    >
                      Active
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Progress towards next tier */}
        {nextTier && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2.5 space-y-1.5">
            <p className="text-xs font-semibold text-foreground">
              Progress towards{" "}
              {nextTier.charAt(0).toUpperCase() + nextTier.slice(1)} Badge
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Avg confidence:{" "}
                <span className="text-foreground font-semibold">
                  {avgConfidence}%
                </span>
              </span>
              <span>Need: {nextTierThreshold}%+</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${Math.min(100, (avgConfidence / Math.max(1, nextTierThreshold)) * 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Keep listening with the tab focused for higher confidence scores
            </p>
          </div>
        )}

        {/* Recent PoL sessions */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Recent Listening Sessions
          </p>
          {sessionsLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No sessions recorded yet
            </p>
          ) : (
            sessions.map((session, i) => (
              <div
                key={session.sessionId || i}
                className="flex items-center gap-3 rounded-lg bg-muted/20 border border-border px-3 py-2"
                data-ocid={`wallet.pol_sessions.item.${i + 1}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-foreground capitalize">
                      {session.contentType}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {session.contentId.slice(0, 16)}&hellip;
                    </span>
                  </div>
                  <ConfidenceBar score={session.confidenceScore} />
                </div>
                <div className="text-right shrink-0">
                  {session.tokensEarned > 0 ? (
                    <p className="text-xs font-bold text-primary">
                      +{formatMIK97(session.tokensEarned)} MIK97
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">—</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(session.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function WalletPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const isAuthenticated = !!identity;
  const [copiedPrincipal, setCopiedPrincipal] = useState(false);

  const principalText = (() => {
    if (!identity) return null;
    const p = identity.getPrincipal();
    if (p.isAnonymous()) return null;
    return p.toString();
  })();

  const truncatedPrincipal = principalText
    ? `${principalText.slice(0, 8)}...${principalText.slice(-5)}`
    : null;

  function copyPrincipal() {
    if (!principalText) return;
    navigator.clipboard.writeText(principalText).then(() => {
      setCopiedPrincipal(true);
      setTimeout(() => setCopiedPrincipal(false), 2000);
    });
  }
  const { data: wallet, isLoading } = useUserWallet();
  const { data: capStatus } = useDailyCapStatus();
  const createWallet = useCreateOrGetWallet();
  const dailyCapConfig = useGetDailyCapConfig().data;
  const SHOWCASE_CAP = dailyCapConfig ? Number(dailyCapConfig.showcaseCap) : 50;
  const BONUS_CAP = dailyCapConfig ? Number(dailyCapConfig.bonusCap) : 100;
  const { data: bonusConfig } = useGetBonusEarningConfig();
  const { data: rewardRateConfig } = useGetRewardRateConfig();
  const { data: dailyEarnings } = useGetMyDailyEarnings();
  const { data: earningsByCategory } = useGetMyDailyEarningsByCategory();
  const { data: mixtapeRewardConfig } = useGetMixtapeRewardConfig();
  const { data: forumRewardConfig } = useGetForumRewardConfig();
  const { data: milestone } = useGetFundingMilestone();
  const { data: platformToggles } = useGetPlatformToggles();
  const { data: stakingConfig } = useGetStakingConfig();
  const { data: isAdmin } = useIsCallerAdmin();

  // Per-section cap values — each comes from its own live backend config
  const GAMES_CAP = dailyCapConfig ? Number(dailyCapConfig.gamesCap) : 100;
  const MUSIC_CAP = dailyCapConfig ? Number(dailyCapConfig.musicCap) : 50;
  const LIVE_CAP = dailyCapConfig ? Number(dailyCapConfig.liveCap) : 30;
  const MIXTAPE_CAP = mixtapeRewardConfig?.dailyCap
    ? Number(mixtapeRewardConfig.dailyCap)
    : 200;
  const FORUM_CAP = forumRewardConfig?.dailyEarningCap
    ? Number(forumRewardConfig.dailyEarningCap)
    : 10;

  // Global daily cap — prefer backend-computed auto-sum (includes all 7 sections)
  // Falls back to frontend sum if backend hasn't returned data yet.
  const FRONTEND_TOTAL_CAP =
    GAMES_CAP +
    MUSIC_CAP +
    LIVE_CAP +
    SHOWCASE_CAP +
    MIXTAPE_CAP +
    FORUM_CAP +
    BONUS_CAP;
  // Use backend globalCap when available (it auto-sums all 7 sections live)
  const TOTAL_DAILY_CAP =
    dailyEarnings?.globalCap && dailyEarnings.globalCap > 0
      ? dailyEarnings.globalCap
      : FRONTEND_TOTAL_CAP;

  const loginBonusTokens = bonusConfig
    ? Number(bonusConfig.loginBonusTokens)
    : 15;
  const streakBonusTokens = bonusConfig
    ? Number(bonusConfig.streakBonusTokens)
    : 100;
  const streakTarget = bonusConfig ? Number(bonusConfig.streakTarget) : 7;
  const showcaseUploadTokens = bonusConfig
    ? formatMIK97(Number(bonusConfig.showcaseUploadBonusTokens))
    : "50";
  const cashbackPercent = bonusConfig
    ? Number(bonusConfig.purchaseCashbackPercent)
    : 7;

  // Music reward display values from backend config
  const musicIntervalTokens = rewardRateConfig
    ? formatMIK97(Number(rewardRateConfig.musicListeningTokensPerInterval))
    : "1";
  const musicIntervalSecs = rewardRateConfig
    ? Number(rewardRateConfig.musicListeningSeconds)
    : 30;

  // Auto-create wallet on mount if logged in and no wallet
  useEffect(() => {
    if (
      isAuthenticated &&
      !isLoading &&
      wallet === null &&
      !createWallet.isPending
    ) {
      createWallet.mutate(undefined, {
        onError: (err: Error) =>
          toast.error(err.message || "Failed to create wallet"),
      });
    }
  }, [
    isAuthenticated,
    isLoading,
    wallet,
    createWallet.isPending,
    createWallet.mutate,
  ]);

  if (!isAuthenticated) {
    return (
      <div
        data-ocid="wallet.page"
        className="min-h-screen flex items-center justify-center bg-background px-4"
      >
        <Card className="bg-card border-border max-w-md w-full text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <Coins className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-xl font-bold text-foreground">
              Sign in to view your wallet
            </h2>
            <p className="text-muted-foreground text-sm">
              Log in with Internet Identity to access your MIK97 token balance,
              earn history, and discounts.
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

  if (isLoading || createWallet.isPending) {
    return (
      <div
        data-ocid="wallet.loading_state"
        className="min-h-screen bg-background px-4 py-8"
      >
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  // 3-state visibility: hidden / comingSoon / live — admin always sees wallet
  const walletMode = platformToggles?.walletMode ?? "live";

  if (!isAdmin && walletMode === "hidden") {
    return (
      <div
        data-ocid="wallet.hidden.page"
        className="min-h-screen flex items-center justify-center bg-background px-4"
      >
        <Card className="bg-card border-border max-w-md w-full text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <Coins className="h-12 w-12 text-muted-foreground/40 mx-auto" />
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

  // Coming soon overlay — backend data is still fetched, just UI is hidden
  if (!isAdmin && walletMode === "comingSoon") {
    return (
      <div
        data-ocid="wallet.coming_soon.page"
        className="min-h-screen flex items-center justify-center bg-background px-4"
      >
        <div className="max-w-md w-full text-center space-y-6">
          <div className="h-24 w-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
            <Coins className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              Wallet &amp; Rewards
            </h1>
            <p className="text-xl font-bold text-primary">Coming Soon</p>
            <p className="text-muted-foreground text-sm leading-relaxed mt-3">
              MIK97 token wallet and earning history launching soon.
              <br />
              Keep playing, watching, and creating — your rewards are tracking.
            </p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-5 py-4 text-left space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              When Wallet Launches
            </p>
            <ul className="text-sm text-foreground space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                View your full MIK97 balance
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Track daily earning progress across all sections
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Use tokens to discount beat purchases
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const balance = wallet ? Number(wallet.balance) : 0;
  const usdValue = (balance / 100).toFixed(2);
  const tracker = capStatus;
  const gamesEarned = tracker ? Number(tracker.gamesEarned) : 0;
  const musicEarned = tracker ? Number(tracker.musicEarned) : 0;
  const liveEarned = tracker ? Number(tracker.liveEarned) : 0;
  // Per-category breakdown from backend (all 7 sections)
  const cat = earningsByCategory;
  const earningsByCategoryLoading = cat === undefined;

  // Global cap primary values — prefer backend dailyEarnings as single source of truth.
  // It returns totalEarnedToday (all 7 sections combined) and globalCap (auto-sum of section caps).
  // Fall back to category sum if backend earnings not loaded yet.
  const catTotalEarned = cat
    ? (cat.games ?? 0) +
      (cat.music ?? 0) +
      (cat.live ?? 0) +
      (cat.showcase ?? 0) +
      (cat.mixtape ?? 0) +
      (cat.forum ?? 0) +
      (cat.bonus ?? 0)
    : undefined;
  const globalEarned =
    dailyEarnings?.totalEarnedToday != null &&
    dailyEarnings.totalEarnedToday >= 0
      ? dailyEarnings.totalEarnedToday
      : (catTotalEarned ?? 0);
  const globalCap = TOTAL_DAILY_CAP;
  const globalCapHit =
    dailyEarnings?.globalCapHit ??
    (globalCap > 0 ? globalEarned >= globalCap : false);
  const globalCapRemaining =
    dailyEarnings?.globalCapRemaining != null
      ? dailyEarnings.globalCapRemaining
      : Math.max(0, globalCap - globalEarned);
  const globalRemaining = globalCapRemaining;
  const globalResetSecs = dailyEarnings?.resetInSeconds ?? 86400;
  const globalResetHours = Math.floor(globalResetSecs / 3600);
  const globalResetMins = Math.floor((globalResetSecs % 3600) / 60);
  const globalPct =
    globalCap > 0 ? Math.min((globalEarned / globalCap) * 100, 100) : 0;
  // isGlobalDataLoading — true until BOTH backend sources have responded
  const isGlobalDataLoading =
    earningsByCategoryLoading && dailyEarnings === undefined;
  const earnHistory = wallet?.earnHistory ?? [];
  const spendHistory = wallet?.spendHistory ?? [];

  const bonusItems = [
    {
      icon: Gift,
      label: "Daily Login Bonus",
      detail: `+${loginBonusTokens} MIK97 · Every 24 hours`,
    },
    {
      icon: Flame,
      label: `${streakTarget}-Day Streak Bonus`,
      detail: `+${streakBonusTokens} MIK97 · Complete ${streakTarget} days in a row`,
    },
    {
      icon: Upload,
      label: "Showcase Upload",
      detail: `+${showcaseUploadTokens} MIK97 · When your track is submitted`,
    },
    {
      icon: ShoppingBag,
      label: "Beat Purchase Cashback",
      detail: `${cashbackPercent}% back in MIK97 · On every paid beat`,
    },
  ];

  return (
    <div
      data-ocid="wallet.page"
      className="min-h-screen bg-background px-4 py-8"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header + Balance */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Coins className="h-8 w-8 text-primary" />
            MIK97 Wallet
          </h1>
          <p className="text-muted-foreground text-sm">
            Your MikupBeats reward token
          </p>
          {principalText && truncatedPrincipal && (
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium shrink-0">
                Wallet Address:
              </span>
              <span
                className="text-xs text-foreground/80 font-mono bg-muted/60 border border-border/60 rounded px-2 py-0.5 min-w-0 break-all"
                title={principalText}
              >
                {truncatedPrincipal}
              </span>
              <button
                type="button"
                data-ocid="wallet.copy_address_button"
                onClick={copyPrincipal}
                className="shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded border border-border/60 bg-muted/40 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors duration-150 text-muted-foreground"
                aria-label="Copy wallet address"
              >
                {copiedPrincipal ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Clipboard className="h-3 w-3" />
                )}
                <span>{copiedPrincipal ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Balance Card */}
        <Card
          data-ocid="wallet.balance.card"
          className="bg-card border-primary/20 shadow-lg"
        >
          <CardContent className="pt-6 pb-6">
            <div className="text-center space-y-2">
              <div className="text-6xl font-black text-primary tabular-nums tracking-tight">
                {formatMIK97(balance)}
              </div>
              <div className="text-lg font-semibold text-foreground">MIK97</div>
              <div className="text-sm text-muted-foreground">
                = <span className="text-accent font-semibold">${usdValue}</span>{" "}
                in discounts
              </div>
            </div>
            <div className="mt-5 flex items-start gap-2 bg-muted/40 rounded-lg p-3">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">
                  100 MIK97 = $1 USD discount value.
                </span>{" "}
                Use tokens at checkout to save on beats, showcase entries, and
                mixtape drops.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Daily Bonus Card */}
        <DailyBonusCard
          loginBonusTokens={loginBonusTokens}
          streakBonusTokens={streakBonusTokens}
          streakTarget={streakTarget}
        />

        {/* Bonus Earning Info */}
        <Card
          data-ocid="wallet.bonus_earning.card"
          className="bg-card border-border"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              Bonus Earning Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {bonusItems.map(({ icon: Icon, label, detail }, i) => (
                <div
                  key={label}
                  data-ocid={`wallet.bonus_info.item.${i + 1}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border"
                >
                  <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Cap Progress */}
        <Card
          className="bg-card border-border"
          data-ocid="wallet.daily_earnings.card"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Daily Earning Limit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Global daily cap — primary display */}
            {isGlobalDataLoading ? (
              <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 space-y-2.5 animate-pulse">
                <div className="h-4 w-48 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-32 rounded bg-muted" />
              </div>
            ) : (
              <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-foreground">
                    Global Daily Limit (All Activities)
                  </span>
                  {globalCapHit ? (
                    <Badge
                      variant="outline"
                      className="border-destructive text-destructive text-xs"
                      data-ocid="wallet.daily_earnings.cap_hit_badge"
                    >
                      Daily limit reached
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-green-500 text-green-500 text-xs"
                      data-ocid="wallet.daily_earnings.active_badge"
                    >
                      Earning active
                    </Badge>
                  )}
                </div>
                <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      globalCapHit ? "bg-destructive" : "bg-primary"
                    }`}
                    style={{ width: `${globalPct}%` }}
                    data-ocid="wallet.daily_earnings.progress_bar"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    <span className="text-foreground font-semibold">
                      {formatMIK97(globalEarned)}
                    </span>{" "}
                    earned today / {formatMIK97(globalCap)} MIK97 limit
                  </span>
                  <span className="text-muted-foreground">
                    {globalPct.toFixed(0)}%
                  </span>
                </div>
                {!globalCapHit && (
                  <p className="text-xs text-muted-foreground">
                    Remaining today:{" "}
                    <span className="text-primary font-semibold">
                      {formatMIK97(globalRemaining)} MIK97
                    </span>
                  </p>
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>
                    Resets in{" "}
                    <span className="text-foreground font-medium">
                      {globalResetHours}h {globalResetMins}m
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* Per-section breakdown — always visible */}
            <div
              className="space-y-3 pt-1"
              data-ocid="wallet.daily_earnings.breakdown"
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Section Breakdown
              </p>
              {/* GAMES — combined Jumper + Flappy */}
              <ProgressBar
                value={cat?.games ?? gamesEarned}
                max={Math.max(1, GAMES_CAP)}
                label="Games (Jumper + Flappy)"
              />
              <ProgressBar
                value={cat?.music ?? musicEarned}
                max={Math.max(1, MUSIC_CAP)}
                label="Music Listening"
              />
              <ProgressBar
                value={cat?.live ?? liveEarned}
                max={Math.max(1, LIVE_CAP)}
                label="Live Watch"
              />
              <ProgressBar
                value={cat?.showcase ?? 0}
                max={Math.max(1, SHOWCASE_CAP)}
                label="Showcase Upload"
              />
              <ProgressBar
                value={cat?.mixtape ?? 0}
                max={Math.max(1, MIXTAPE_CAP)}
                label="Mixtape Upload"
              />
              <ProgressBar
                value={cat?.forum ?? 0}
                max={Math.max(1, FORUM_CAP)}
                label="Forum Posts"
              />
              <ProgressBar
                value={cat?.bonus ?? 0}
                max={Math.max(1, BONUS_CAP)}
                label="Bonus Actions"
              />
            </div>

            <p className="text-xs text-muted-foreground pt-1">
              Caps reset every 24 hours · Max{" "}
              <span className="text-foreground font-medium">
                {formatMIK97(TOTAL_DAILY_CAP)} MIK97/day
              </span>{" "}
              across all 7 categories (Games, Music, Live, Showcase, Mixtape,
              Forum, Bonus)
            </p>
          </CardContent>
        </Card>
        {/* Staking Vault */}
        {stakingConfig?.isEnabled && (
          <Card
            className="bg-card border-border"
            data-ocid="wallet.staking.card"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Staking Vault
                <span className="ml-auto text-xs font-normal text-primary border border-primary/40 rounded px-1.5 py-0.5">
                  {stakingConfig.tier1Apy}% – {stakingConfig.tier3Apy}% APY
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StakingSection
                walletBalance={balance}
                stakingConfig={stakingConfig}
              />
            </CardContent>
          </Card>
        )}

        {/* PoL Verified Listener Badges */}
        <PoLBadgesSection />

        {/* How to Earn */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              How to Earn MIK97
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {[
                {
                  id: "games",
                  icon: Gamepad2,
                  label: "Play Games",
                  detail: `Jumper & Flappy · up to ${GAMES_CAP}/day`,
                  action: () => navigate({ to: "/games" }),
                  actionLabel: "Play Now",
                },
                {
                  id: "music",
                  icon: Music,
                  label: "Listen to Beats & Tracks",
                  detail: `${musicIntervalTokens} MIK97 per ${musicIntervalSecs}s · album completions · up to ${MUSIC_CAP}/day`,
                  action: null,
                  actionLabel: null,
                },
                {
                  id: "live",
                  icon: Radio,
                  label: "Watch Live Streams",
                  detail: `5–30 min sessions · up to ${LIVE_CAP}/day`,
                  action: null,
                  actionLabel: null,
                },
                {
                  id: "login",
                  icon: Coins,
                  label: "Daily Login & Streaks",
                  detail: `+${loginBonusTokens}/day login · +${streakBonusTokens} for ${streakTarget}-day streak`,
                  action: null,
                  actionLabel: null,
                },
                {
                  id: "cashback",
                  icon: TrendingUp,
                  label: "Purchase Cashback",
                  detail: `${cashbackPercent}% MIK97 back on every paid beat`,
                  action: null,
                  actionLabel: null,
                },
              ].map(
                ({ id, icon: Icon, label, detail, action, actionLabel }, i) => (
                  <div
                    key={id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border"
                    data-ocid={`wallet.earn_tip.item.${i + 1}`}
                  >
                    <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground">{detail}</p>
                    </div>
                    {action && (
                      <Button
                        size="sm"
                        variant="default"
                        className="shrink-0 text-xs h-7 px-3"
                        onClick={action}
                        data-ocid="wallet.play_games.button"
                      >
                        {actionLabel}
                      </Button>
                    )}
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>

        {/* Earn History */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Earn History</CardTitle>
          </CardHeader>
          <CardContent>
            {earnHistory.length === 0 ? (
              <div
                data-ocid="wallet.earn_history.empty_state"
                className="text-center py-8 space-y-2"
              >
                <Coins className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  No earnings yet — start playing games or listening to beats!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...earnHistory].reverse().map((entry, i) => (
                  <div
                    key={`${String(entry.timestamp)}-${Number(entry.amount)}-${i}`}
                    className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg bg-muted/20 border border-border"
                    data-ocid={`wallet.earn_history.item.${i + 1}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">
                        {formatEarnDescription(entry.description)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(entry.timestamp)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-xs ${earnCategoryColor(entry.category)}`}
                      >
                        {earnCategoryLabel(entry.category)}
                      </Badge>
                      <span className="text-sm font-bold text-primary">
                        +{formatAmount(Number(entry.amount))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spend History */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Spend History</CardTitle>
          </CardHeader>
          <CardContent>
            {spendHistory.length === 0 ? (
              <div
                data-ocid="wallet.spend_history.empty_state"
                className="text-center py-8 space-y-2"
              >
                <TrendingUp className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  No spending yet — earn tokens to unlock discounts!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...spendHistory].reverse().map((entry, i) => (
                  <div
                    key={`${String(entry.timestamp)}-${Number(entry.amount)}-${i}`}
                    className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg bg-muted/20 border border-border"
                    data-ocid={`wallet.spend_history.item.${i + 1}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">
                        {spendUseCaseLabel(entry.useCase)}
                      </p>
                      {entry.beatId && (
                        <p className="text-xs text-muted-foreground truncate">
                          Beat: {entry.beatId}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(entry.timestamp)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-destructive shrink-0">
                      -{formatAmount(Number(entry.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* MIK97 Discount Guide */}
        <Card
          className="bg-card border-border"
          data-ocid="wallet.discount_guide.card"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              MIK97 Discount Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Funding milestone note */}
            {milestone && (
              <div
                className={`rounded-lg border px-4 py-3 space-y-2 ${milestone.reached ? "border-green-500/40 bg-green-500/5" : "border-primary/30 bg-primary/5"}`}
                data-ocid="wallet.discount_guide.milestone_note"
              >
                {milestone.reached ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <p className="text-sm font-bold text-green-400">
                      MIK97 is now a live blockchain token!
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary shrink-0" />
                        <p className="text-sm font-semibold text-foreground">
                          Platform Funding Goal:{" "}
                          {milestone.goal.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                            maximumFractionDigits: 0,
                          })}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {Math.min(milestone.percentage, 100).toFixed(1)}% funded
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${Math.min(milestone.percentage, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Once this goal is reached, MIK97 launches on the
                      blockchain as a real token. Current rate:{" "}
                      <span className="text-foreground font-medium">
                        100 MIK97 = $1.00 off
                      </span>{" "}
                      your purchase.
                    </p>
                  </>
                )}
              </div>
            )}
            {/* Core rule */}
            <div className="flex items-start gap-3 rounded-lg bg-primary/10 border border-primary/20 px-4 py-3">
              <Coins className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-foreground">
                  100 MIK97 = $1.00 off any purchase
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fixed rate. 500 MIK97 = $5 off. 1,000 = $10 off. 2,500 = $25
                  off.
                </p>
              </div>
            </div>

            {/* Example table */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Example Discounts
              </p>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">
                        MIK97 Tokens
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">
                        Discount Value
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">
                        Example Use
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        tokens: "500",
                        usd: "$5.00",
                        example: "Partial off any beat",
                      },
                      {
                        tokens: "1,000",
                        usd: "$10.00",
                        example: "Save on a $25 beat",
                      },
                      {
                        tokens: "2,500",
                        usd: "$25.00",
                        example: "$25 beat is FREE",
                      },
                      {
                        tokens: "5,000",
                        usd: "$50.00",
                        example: "$50 beat is FREE",
                      },
                      {
                        tokens: "7,000",
                        usd: "$70.00",
                        example: "Big savings on premium",
                      },
                    ].map(({ tokens, usd, example }, i) => (
                      <tr
                        key={tokens}
                        className={`border-b border-border last:border-0 ${i % 2 === 0 ? "bg-muted/10" : ""}`}
                        data-ocid={`wallet.discount_guide.row.${i + 1}`}
                      >
                        <td className="px-3 py-2 font-mono text-foreground">
                          {tokens}
                        </td>
                        <td className="px-3 py-2 font-semibold text-green-400">
                          {usd}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {example}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rules list */}
            <div className="space-y-2.5">
              {[
                {
                  id: "custom-amount",
                  icon: Info,
                  text: "Enter ANY amount — not just preset tiers. You have full control over how many tokens to apply.",
                },
                {
                  id: "exact-burn",
                  icon: ShoppingBag,
                  text: "Only the exact tokens needed to cover the discount are burned. If you enter more than the purchase price, the rest stays in your wallet.",
                },
                {
                  id: "permanent-burn",
                  icon: Flame,
                  text: "Tokens burn permanently when used — they are removed from supply and cannot be refunded.",
                },
                {
                  id: "price-cap",
                  icon: Star,
                  text: "The discount can never exceed the purchase price. You'll never lose tokens beyond what covers the cost.",
                },
              ].map(({ id, icon: Icon, text }, i) => (
                <div
                  key={id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border"
                  data-ocid={`wallet.discount_guide.rule.${i + 1}`}
                >
                  <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {text}
                  </p>
                </div>
              ))}
            </div>

            {/* Where to use */}
            <div className="rounded-lg border border-border bg-muted/10 px-4 py-3">
              <p className="text-xs font-semibold text-foreground mb-1.5">
                Where you can use MIK97 discounts:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <Music className="h-3 w-3 text-primary shrink-0" />
                  Beat purchases in the Store (any rights tier)
                </li>
                <li className="flex items-center gap-2">
                  <Upload className="h-3 w-3 text-primary shrink-0" />
                  Paid Mixtape &amp; Album drop submissions
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
