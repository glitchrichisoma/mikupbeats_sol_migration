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
  CheckCircle2,
  Coins,
  Eye,
  Flame,
  Gamepad2,
  Gift,
  Info,
  Lock,
  Music,
  Percent,
  RefreshCw,
  ShoppingBag,
  Star,
  ToggleLeft,
  TrendingDown,
  TrendingUp,
  Tv,
  Upload,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  RewardRateConfig,
  DailyCapConfig as _DailyCapConfig,
} from "../../backend";

import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetBeatTierDiscountConfig,
  useGetBonusEarningConfig,
  useGetDailyCapConfig,
  useGetDynamicRatioConfig,
  useGetDynamicRewardPreview,
  useGetForumRewardConfig,
  useGetMixtapeRewardConfig,
  useGetRewardRateConfig,
  useGetRewardSectionToggles,
  useGetStakingConfig,
  useGetStakingPenaltyConfig,
  useSetPenaltyRouting,
  useUpdateBeatTierDiscountConfig,
  useUpdateBonusEarningConfig,
  useUpdateDailyCapConfig,
  useUpdateDynamicRatioConfig,
  useUpdateForumRewardConfig,
  useUpdateMixtapeRewardConfigWithEnabled,
  useUpdateRewardRateConfig,
  useUpdateRewardSectionToggles,
  useUpdateStakingConfig,
  useUpdateStakingPenaltyConfig,
} from "../../hooks/useQueries";
import type {
  BeatTierDiscountConfig,
  BonusEarningConfig,
  MixtapeRewardConfig,
} from "../../hooks/useQueries";
import type {
  DollarValueConfig,
  DynamicRatioConfig,
  ForumRewardConfig,
  PerSectionRewardMode,
} from "../../types/treasury";
import ErrorBoundary, { SectionError } from "../ErrorBoundary";

// ── Helpers ────────────────────────────────────────────────────────────────────

const NS_PER_DAY = BigInt(24) * BigInt(60) * BigInt(60) * BigInt(1_000_000_000);

function nsToDays(ns: bigint): number {
  return Number(ns / NS_PER_DAY);
}

function daysToNs(days: number): bigint {
  return BigInt(Math.round(days)) * NS_PER_DAY;
}

function safeInt(s: string): number {
  const n = Number.parseInt(s, 10);
  return Number.isNaN(n) ? -1 : n;
}

function safeFloat(s: string): number {
  const n = Number.parseFloat(s);
  return Number.isNaN(n) ? -1 : n;
}

function configToDisplay(raw: number | bigint): string {
  const val = typeof raw === "bigint" ? Number(raw) : raw;
  if (!Number.isFinite(val)) return "0";
  return Number.parseFloat(val.toFixed(8)).toString();
}

function displayToConfigFloat(s: string): number {
  const f = safeFloat(s);
  return f < 0 ? -1 : f;
}

// ── Shared Save Button ────────────────────────────────────────────────────────

function SaveButton({
  status,
  onClick,
  ocid,
}: {
  status: "idle" | "saving" | "saved" | "error";
  onClick: () => void;
  ocid: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={onClick}
        disabled={status === "saving"}
        className="bg-primary text-primary-foreground"
        data-ocid={ocid}
      >
        {status === "saving" ? "Saving…" : "Save Changes"}
      </Button>
      {status === "saved" && (
        <span
          className="flex items-center gap-1 text-xs text-emerald-500 font-medium"
          data-ocid={`${ocid}.success_state`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Saved
        </span>
      )}
      {status === "error" && (
        <span
          className="flex items-center gap-1 text-xs text-destructive font-medium"
          data-ocid={`${ocid}.error_state`}
        >
          <XCircle className="h-3.5 w-3.5" />
          Error
        </span>
      )}
    </div>
  );
}

// ── Reward Lock Toggle ─────────────────────────────────────────────────────────

function RewardLockToggle({
  enabled,
  onToggle,
  label,
  note,
  ocid,
}: {
  enabled: boolean;
  onToggle: (val: boolean) => void;
  label: string;
  note: string;
  ocid: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/10">
      <div className="flex items-center gap-2">
        <div
          className={`h-2 w-2 rounded-full flex-shrink-0 ${enabled ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
        />
        <div>
          <p
            className={`text-sm font-medium ${enabled ? "text-foreground" : "text-muted-foreground"}`}
          >
            {label}
          </p>
          <p className="text-xs text-muted-foreground">{note}</p>
        </div>
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} data-ocid={ocid} />
    </div>
  );
}

// ── Staking Config Section ─────────────────────────────────────────

function StakingConfigSection() {
  const { data: config, isLoading } = useGetStakingConfig();
  const update = useUpdateStakingConfig();
  const { data: penaltyConfig } = useGetStakingPenaltyConfig();
  const updatePenalty = useUpdateStakingPenaltyConfig();
  const setPenaltyRouting = useSetPenaltyRouting();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  const [tier1Apy, setTier1Apy] = useState("");
  const [tier2Apy, setTier2Apy] = useState("");
  const [tier3Apy, setTier3Apy] = useState("");
  const [minStake, setMinStake] = useState("");
  const [maxStake, setMaxStake] = useState("");
  const [entryFeeEnabled, setEntryFeeEnabled] = useState(false);
  const [entryFeePercent, setEntryFeePercent] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);

  // Penalty config state
  const [penaltyEnabled, setPenaltyEnabled] = useState(false);
  const [penaltyPercent, setPenaltyPercent] = useState("30");
  // 4-way penalty routing
  const [penaltyBurnPct, setPenaltyBurnPct] = useState("50");
  const [penaltyRewardsPct, setPenaltyRewardsPct] = useState("50");
  const [penaltyPromoPct, setPenaltyPromoPct] = useState("0");
  const [penaltyReservePct, setPenaltyReservePct] = useState("0");
  const [routingStatus, setRoutingStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  useEffect(() => {
    if (config) {
      setTier1Apy(configToDisplay(config.tier1Apy));
      setTier2Apy(configToDisplay(config.tier2Apy));
      setTier3Apy(configToDisplay(config.tier3Apy));
      setMinStake(configToDisplay(config.minStake));
      setMaxStake(configToDisplay(config.maxStake));
      setEntryFeeEnabled(config.entryFeeEnabled);
      setEntryFeePercent(configToDisplay(config.entryFeePercent));
      setIsEnabled(config.isEnabled);
      setPenaltyEnabled(config.earlyUnstakePenaltyEnabled);
      setPenaltyPercent(configToDisplay(config.earlyUnstakePenaltyPercent));
      // Load routing from backend StakingConfig fields
      setPenaltyBurnPct(configToDisplay(config.earlyUnstakePenaltyBurnPct));
      setPenaltyRewardsPct(
        configToDisplay(config.earlyUnstakePenaltyRewardsPct),
      );
      setPenaltyPromoPct(configToDisplay(config.earlyUnstakePenaltyPromoPct));
      setPenaltyReservePct(
        configToDisplay(config.earlyUnstakePenaltyReservePct),
      );
    }
  }, [config]);

  useEffect(() => {
    if (penaltyConfig) {
      setPenaltyEnabled(penaltyConfig.earlyUnstakePenaltyEnabled);
      setPenaltyPercent(String(penaltyConfig.earlyUnstakePenaltyPercent));
      setPenaltyBurnPct(String(penaltyConfig.earlyUnstakeBurnPercent));
      setPenaltyRewardsPct(String(penaltyConfig.earlyUnstakeRewardsPercent));
    }
  }, [penaltyConfig]);

  const burnNum = safeFloat(penaltyBurnPct);
  const rewardsNum = safeFloat(penaltyRewardsPct);
  const promoNum = safeFloat(penaltyPromoPct);
  const reserveNum = safeFloat(penaltyReservePct);
  const routingTotal = Math.round(burnNum + rewardsNum + promoNum + reserveNum);
  const routingValid = routingTotal === 100;

  const handleSave = () => {
    const t1 = displayToConfigFloat(tier1Apy);
    const t2 = displayToConfigFloat(tier2Apy);
    const t3 = displayToConfigFloat(tier3Apy);
    const mn = displayToConfigFloat(minStake);
    const mx = displayToConfigFloat(maxStake);
    const fee = displayToConfigFloat(entryFeePercent);
    if ([t1, t2, t3, mn, mx, fee].some((v) => v < 0)) {
      toast.error("All fields must be valid numbers.");
      return;
    }
    if (penaltyEnabled && !routingValid) {
      toast.error(
        `Penalty routing must sum to 100% (currently ${routingTotal}%).`,
      );
      return;
    }

    setStatus("saving");
    update.mutate(
      {
        tier1Apy: t1,
        tier2Apy: t2,
        tier3Apy: t3,
        minStake: mn,
        maxStake: mx,
        entryFeeEnabled,
        entryFeePercent: fee,
        isEnabled,
        earlyUnstakePenaltyEnabled: penaltyEnabled,
        earlyUnstakePenaltyPercent: safeFloat(penaltyPercent),
        earlyUnstakePenaltyBurnPct: burnNum,
        earlyUnstakePenaltyRewardsPct: rewardsNum,
        earlyUnstakePenaltyPromoPct: promoNum,
        earlyUnstakePenaltyReservePct: reserveNum,
      },
      {
        onSuccess: () => {
          updatePenalty.mutate({
            earlyUnstakePenaltyEnabled: penaltyEnabled,
            earlyUnstakePenaltyPercent: safeFloat(penaltyPercent),
            earlyUnstakeBurnPercent: burnNum,
            earlyUnstakeRewardsPercent: rewardsNum,
          });
          setStatus("saved");
          toast.success("Staking config saved.");
          setTimeout(() => setStatus("idle"), 2500);
        },
        onError: (e: Error) => {
          setStatus("error");
          toast.error(e.message || "Save failed");
          setTimeout(() => setStatus("idle"), 3000);
        },
      },
    );
  };

  const handleSaveRouting = () => {
    if (!routingValid) {
      toast.error(`Routing must sum to 100% (currently ${routingTotal}%).`);
      return;
    }
    setRoutingStatus("saving");
    setPenaltyRouting.mutate(
      {
        burnPct: burnNum,
        rewardsPct: rewardsNum,
        promoPct: promoNum,
        reservePct: reserveNum,
      },
      {
        onSuccess: () => {
          setRoutingStatus("saved");
          toast.success("Penalty routing saved.");
          setTimeout(() => setRoutingStatus("idle"), 2500);
        },
        onError: (e: Error) => {
          setRoutingStatus("error");
          toast.error(e.message || "Routing save failed");
          setTimeout(() => setRoutingStatus("idle"), 3000);
        },
      },
    );
  };

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-5">
      {/* Enable/Disable toggle */}
      <RewardLockToggle
        enabled={isEnabled}
        onToggle={setIsEnabled}
        label="Staking Vault Enabled"
        note="When off, the staking section is hidden from the wallet page."
        ocid="reward_settings.staking.enabled_toggle"
      />

      {/* APY Tiers */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          APY Tiers
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "30-Day APY (%)",
              val: tier1Apy,
              set: setTier1Apy,
              ocid: "staking.tier1_apy",
            },
            {
              label: "90-Day APY (%)",
              val: tier2Apy,
              set: setTier2Apy,
              ocid: "staking.tier2_apy",
            },
            {
              label: "180-Day APY (%)",
              val: tier3Apy,
              set: setTier3Apy,
              ocid: "staking.tier3_apy",
            },
          ].map(({ label, val, set, ocid }) => (
            <div key={ocid} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Input
                value={val}
                onChange={(e) => set(e.target.value)}
                placeholder="e.g. 10"
                data-ocid={`reward_settings.${ocid}_input`}
                className="h-8 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Min/Max Stake */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Stake Limits (MIK97)
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Minimum Stake
            </Label>
            <Input
              value={minStake}
              onChange={(e) => setMinStake(e.target.value)}
              placeholder="e.g. 100"
              data-ocid="reward_settings.staking.min_stake_input"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Maximum Stake
            </Label>
            <Input
              value={maxStake}
              onChange={(e) => setMaxStake(e.target.value)}
              placeholder="e.g. 100000"
              data-ocid="reward_settings.staking.max_stake_input"
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Entry Fee */}
      <div className="space-y-3">
        <RewardLockToggle
          enabled={entryFeeEnabled}
          onToggle={setEntryFeeEnabled}
          label="Entry Fee"
          note="Charge a percentage fee on each stake. Fee goes back to the Rewards Pool."
          ocid="reward_settings.staking.entry_fee_toggle"
        />
        {entryFeeEnabled && (
          <div className="space-y-1 pl-2">
            <Label className="text-xs text-muted-foreground">
              Entry Fee (%)
            </Label>
            <Input
              value={entryFeePercent}
              onChange={(e) => setEntryFeePercent(e.target.value)}
              placeholder="e.g. 1.5"
              data-ocid="reward_settings.staking.entry_fee_percent_input"
              className="h-8 text-sm max-w-40"
            />
          </div>
        )}
      </div>

      {/* Early Unstake Penalty */}
      <div className="space-y-3">
        <RewardLockToggle
          enabled={penaltyEnabled}
          onToggle={setPenaltyEnabled}
          label="Early Unstake Penalty"
          note="Charge a sliding-scale penalty on the principal when a user unstakes before the lock period ends."
          ocid="reward_settings.staking.penalty_toggle"
        />
        {penaltyEnabled && (
          <div className="pl-2 space-y-4">
            {/* Starting Penalty Rate */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">
                  Starting / Max Penalty Rate (%)
                </Label>
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  <TrendingDown className="h-3 w-3" />
                  Sliding Scale
                </span>
              </div>
              <Input
                value={penaltyPercent}
                onChange={(e) => setPenaltyPercent(e.target.value)}
                placeholder="e.g. 30"
                data-ocid="reward_settings.staking.penalty_percent_input"
                className="h-8 text-sm max-w-40"
              />
              <p className="text-xs text-muted-foreground">
                This is the <strong>starting (maximum)</strong> penalty on day 1
                of a lock period. It counts down automatically — not a flat
                rate.
              </p>
            </div>

            {/* Tier Breakdown Info Box */}
            <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                <p className="text-xs font-semibold text-foreground">
                  Sliding Scale Breakdown
                </p>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-primary w-20 shrink-0">
                    30-day
                  </span>
                  <span>
                    Penalty drops 1% per day staked → starts at{" "}
                    {penaltyPercent || 30}%, reaches 1% by day 30
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-primary w-20 shrink-0">
                    90-day
                  </span>
                  <span>
                    Penalty drops 1% every 3 days → starts at{" "}
                    {penaltyPercent || 30}%, reaches 1% by day 90
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-primary w-20 shrink-0">
                    180-day
                  </span>
                  <span>
                    Penalty drops 1% every 6 days → starts at{" "}
                    {penaltyPercent || 30}%, reaches 1% by day 180
                  </span>
                </div>
              </div>
            </div>

            {/* 4-Way Penalty Routing */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Percent className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Penalty Split Routing
                </p>
              </div>
              <p className="text-xs text-muted-foreground -mt-1">
                When a penalty is charged, set where the penalty tokens go. All
                4 values must sum to 100%.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Flame className="h-3 w-3 text-destructive" /> Burn (%)
                  </Label>
                  <Input
                    value={penaltyBurnPct}
                    onChange={(e) => setPenaltyBurnPct(e.target.value)}
                    placeholder="50"
                    data-ocid="reward_settings.staking.penalty_burn_pct_input"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-primary" /> Rewards Pool
                    (%)
                  </Label>
                  <Input
                    value={penaltyRewardsPct}
                    onChange={(e) => setPenaltyRewardsPct(e.target.value)}
                    placeholder="50"
                    data-ocid="reward_settings.staking.penalty_rewards_pct_input"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3 text-yellow-500" /> Promotions Pool
                    (%)
                  </Label>
                  <Input
                    value={penaltyPromoPct}
                    onChange={(e) => setPenaltyPromoPct(e.target.value)}
                    placeholder="0"
                    data-ocid="reward_settings.staking.penalty_promo_pct_input"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3 text-muted-foreground" /> Reserve
                    Pool (%)
                  </Label>
                  <Input
                    value={penaltyReservePct}
                    onChange={(e) => setPenaltyReservePct(e.target.value)}
                    placeholder="0"
                    data-ocid="reward_settings.staking.penalty_reserve_pct_input"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              {!routingValid ? (
                <p className="text-xs text-destructive flex items-center gap-1">
                  ⚠ Routing must sum to 100% (currently {routingTotal}%)
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  ✓ Routing valid: {burnNum}% burned · {rewardsNum}% Rewards ·{" "}
                  {promoNum}% Promotions · {reserveNum}% Reserve
                </p>
              )}
              <SaveButton
                status={routingStatus}
                onClick={handleSaveRouting}
                ocid="reward_settings.staking.routing_save_button"
              />
            </div>
          </div>
        )}
      </div>

      <SaveButton
        status={status}
        onClick={handleSave}
        ocid="reward_settings.staking.save_button"
      />
    </div>
  );
}

// ── Daily Caps Section ────────────────────────────────────────────────────────

function DailyCapsSection() {
  const { data: config, isLoading, isError, refetch } = useGetDailyCapConfig();
  const update = useUpdateDailyCapConfig();

  const [games, setGames] = useState("");
  const [music, setMusic] = useState("");
  const [live, setLive] = useState("");
  const [showcase, setShowcase] = useState("");
  const [bonus, setBonus] = useState("");
  const [total, setTotal] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  useEffect(() => {
    if (config) {
      setGames(configToDisplay(config.gamesCap));
      setMusic(configToDisplay(config.musicCap));
      setLive(configToDisplay(config.liveCap));
      setShowcase(configToDisplay(config.showcaseCap));
      setBonus(configToDisplay(config.bonusCap));
      setTotal(configToDisplay(config.totalDailyCapAcrossAll));
    }
  }, [config]);

  const handleSave = () => {
    const gamesVal = displayToConfigFloat(games);
    const musicVal = displayToConfigFloat(music);
    const liveVal = displayToConfigFloat(live);
    const showcaseVal = displayToConfigFloat(showcase);
    const bonusVal = displayToConfigFloat(bonus);
    const totalVal = displayToConfigFloat(total);
    if (
      [gamesVal, musicVal, liveVal, showcaseVal, bonusVal, totalVal].some(
        (v) => v < 0,
      )
    ) {
      toast.error("All cap values must be non-negative numbers.");
      return;
    }
    const newConfig: _DailyCapConfig = {
      gamesCap: gamesVal,
      musicCap: musicVal,
      liveCap: liveVal,
      showcaseCap: showcaseVal,
      bonusCap: bonusVal,
      totalDailyCapAcrossAll: totalVal,
    };
    setStatus("saving");
    update.mutate(newConfig, {
      onSuccess: () => {
        setStatus("saved");
        toast.success("Daily earning caps updated.");
        setTimeout(() => setStatus("idle"), 3000);
      },
      onError: (err: Error) => {
        setStatus("error");
        toast.error(err.message || "Failed to save caps.");
        setTimeout(() => setStatus("idle"), 3000);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-10 rounded bg-muted/30" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <SectionError label="Daily Earning Caps" onRetry={() => void refetch()} />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Gamepad2 className="h-3.5 w-3.5 text-primary" />
            Games Cap (MIK97 / day)
          </Label>
          <Input
            type="number"
            min={0}
            step="0.00000001"
            value={games}
            onChange={(e) => setGames(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.games_cap_input"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Music className="h-3.5 w-3.5 text-primary" />
            Music Cap (MIK97 / day)
          </Label>
          <Input
            type="number"
            min={0}
            step="0.00000001"
            value={music}
            onChange={(e) => setMusic(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.music_cap_input"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Tv className="h-3.5 w-3.5 text-primary" />
            Live Stream Cap (MIK97 / day)
          </Label>
          <Input
            type="number"
            min={0}
            step="0.00000001"
            value={live}
            onChange={(e) => setLive(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.live_cap_input"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Upload className="h-3.5 w-3.5 text-primary" />
            Showcase Cap (MIK97 / day)
          </Label>
          <Input
            type="number"
            min={0}
            step="0.00000001"
            value={showcase}
            onChange={(e) => setShowcase(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.showcase_cap_input"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-primary" />
            Bonus Actions Cap (MIK97 / day)
          </Label>
          <Input
            type="number"
            min={0}
            step="0.00000001"
            value={bonus}
            onChange={(e) => setBonus(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.bonus_cap_input"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5 text-primary" />
            Total Daily Cap (MIK97 / day)
          </Label>
          <Input
            type="number"
            min={0}
            step="0.00000001"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.total_cap_input"
          />
        </div>
      </div>
      <SaveButton
        status={status}
        onClick={handleSave}
        ocid="reward_settings.caps_save_button"
      />
    </div>
  );
}

// ── Game Ratios Section ───────────────────────────────────────────────────────

function GameRatiosSection() {
  const {
    data: config,
    isLoading,
    isError,
    refetch,
  } = useGetRewardRateConfig();
  const update = useUpdateRewardRateConfig();

  const [jumper, setJumper] = useState("");
  const [flappy, setFlappy] = useState("");
  // Tokens awarded per threshold hit — stored in backend RewardRateConfig
  const [jumperReward, setJumperReward] = useState("1");
  const [flappyReward, setFlappyReward] = useState("1");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  useEffect(() => {
    if (config) {
      setJumper(configToDisplay(config.jumperRatio));
      setFlappy(configToDisplay(config.flappyRatio));
      // Load reward-per-threshold directly from backend config (not localStorage)
      setJumperReward(configToDisplay(config.jumperTokensPerThreshold));
      setFlappyReward(configToDisplay(config.flappyTokensPerThreshold));
    }
  }, [config]);

  const handleSave = () => {
    if (!config) return;
    const jumperN = safeFloat(jumper);
    const flappyN = safeFloat(flappy);
    const jumperRN = safeFloat(jumperReward);
    const flappyRN = safeFloat(flappyReward);
    if (jumperN <= 0 || flappyN <= 0) {
      toast.error("Threshold ratios must be positive numbers.");
      return;
    }
    if (jumperRN <= 0 || flappyRN <= 0) {
      toast.error("Reward amounts must be positive numbers.");
      return;
    }
    setStatus("saving");
    // Send ALL four fields to backend — no localStorage for token amounts
    update.mutate(
      {
        ...config,
        jumperRatio: jumperN,
        flappyRatio: flappyN,
        jumperTokensPerThreshold: jumperRN,
        flappyTokensPerThreshold: flappyRN,
      },
      {
        onSuccess: () => {
          setStatus("saved");
          toast.success("Game ratios updated.");
          setTimeout(() => setStatus("idle"), 3000);
        },
        onError: (err: Error) => {
          setStatus("error");
          toast.error(err.message || "Failed to save ratios.");
          setTimeout(() => setStatus("idle"), 3000);
        },
      },
    );
  };

  const jumperN = safeFloat(jumper);
  const flappyN = safeFloat(flappy);

  if (isLoading)
    return <div className="animate-pulse h-24 rounded bg-muted/30" />;

  if (isError)
    return (
      <SectionError
        label="Game Earning Ratios"
        onRetry={() => void refetch()}
      />
    );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Jumper threshold */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Jumper — Points per Threshold (Score Needed)
          </Label>
          <Input
            type="number"
            min={0.00000001}
            step="0.00000001"
            value={jumper}
            onChange={(e) => setJumper(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.jumper_ratio_input"
          />
          {jumperN > 0 && (
            <p className="text-xs text-primary font-medium">
              Score {jumperN.toLocaleString()} points to hit threshold
            </p>
          )}
        </div>
        {/* Jumper reward per hit */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Jumper — MIK97 Tokens Per Threshold Hit
          </Label>
          <Input
            type="number"
            min={0.00000001}
            step="0.00000001"
            value={jumperReward}
            onChange={(e) => setJumperReward(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.jumper_reward_per_threshold_input"
          />
          <p className="text-xs text-muted-foreground">
            MIK97 awarded each time threshold is reached
          </p>
        </div>
        {/* Flappy threshold */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Flappy — Points per Threshold (Score Needed)
          </Label>
          <Input
            type="number"
            min={0.00000001}
            step="0.00000001"
            value={flappy}
            onChange={(e) => setFlappy(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.flappy_ratio_input"
          />
          {flappyN > 0 && (
            <p className="text-xs text-primary font-medium">
              Score {flappyN.toLocaleString()} points to hit threshold
            </p>
          )}
        </div>
        {/* Flappy reward per hit */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Flappy — MIK97 Tokens Per Threshold Hit
          </Label>
          <Input
            type="number"
            min={0.00000001}
            step="0.00000001"
            value={flappyReward}
            onChange={(e) => setFlappyReward(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.flappy_reward_per_threshold_input"
          />
          <p className="text-xs text-muted-foreground">
            MIK97 awarded each time threshold is reached
          </p>
        </div>
      </div>
      <SaveButton
        status={status}
        onClick={handleSave}
        ocid="reward_settings.game_ratios_save_button"
      />
    </div>
  );
}

// ── Music Rewards Section ─────────────────────────────────────────────────────

function MusicRewardsSection() {
  const {
    data: config,
    isLoading,
    isError,
    refetch,
  } = useGetRewardRateConfig();
  const update = useUpdateRewardRateConfig();

  const [listenSecs, setListenSecs] = useState("");
  const [intervalTokens, setIntervalTokens] = useState("1");
  const [trackTokens, setTrackTokens] = useState("");
  const [albumTokens, setAlbumTokens] = useState("");
  const [cooldownDays, setCooldownDays] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  useEffect(() => {
    if (config) {
      setListenSecs(configToDisplay(config.musicListeningSeconds));
      // Load interval tokens from backend config (not localStorage)
      setIntervalTokens(
        configToDisplay(config.musicListeningTokensPerInterval),
      );
      setTrackTokens(configToDisplay(config.musicTrackCompletionTokens));
      setAlbumTokens(configToDisplay(config.musicAlbumCompletionTokens));
      setCooldownDays(configToDisplay(nsToDays(config.fiveDayCooldownNs)));
    }
  }, [config]);

  const handleSave = () => {
    if (!config) return;
    const secsN = safeFloat(listenSecs);
    const trackN = safeFloat(trackTokens);
    const albumN = safeFloat(albumTokens);
    const daysN = safeFloat(cooldownDays);
    const intervalN = safeFloat(intervalTokens);
    if (secsN <= 0 || intervalN <= 0) {
      toast.error("Listening seconds and interval tokens must be > 0.");
      return;
    }
    if (trackN < 0 || albumN < 0 || daysN < 0) {
      toast.error("All values must be non-negative numbers.");
      return;
    }
    setStatus("saving");
    // Send musicListeningTokensPerInterval to backend — no localStorage
    update.mutate(
      {
        ...config,
        musicListeningSeconds: BigInt(Math.round(secsN)),
        musicListeningTokensPerInterval: intervalN,
        musicTrackCompletionTokens: trackN,
        musicAlbumCompletionTokens: albumN,
        fiveDayCooldownNs: daysToNs(daysN),
      },
      {
        onSuccess: () => {
          setStatus("saved");
          toast.success("Music reward settings updated.");
          setTimeout(() => setStatus("idle"), 3000);
        },
        onError: (err: Error) => {
          setStatus("error");
          toast.error(err.message || "Failed to save music settings.");
          setTimeout(() => setStatus("idle"), 3000);
        },
      },
    );
  };

  if (isLoading)
    return <div className="animate-pulse h-32 rounded bg-muted/30" />;

  if (isError)
    return (
      <SectionError
        label="Music Listening Rewards"
        onRetry={() => void refetch()}
      />
    );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Listening Interval (seconds)
          </Label>
          <Input
            type="number"
            min={1}
            step="1"
            value={listenSecs}
            onChange={(e) => setListenSecs(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.music_listen_secs_input"
          />
          <p className="text-xs text-muted-foreground">
            Every this many seconds of listening triggers a reward
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Tokens Per Listening Interval (MIK97)
          </Label>
          <Input
            type="number"
            min={0}
            step="0.00000001"
            value={intervalTokens}
            onChange={(e) => setIntervalTokens(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.music_interval_tokens_input"
          />
          <p className="text-xs text-muted-foreground">
            MIK97 earned per completed listening interval
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Track Completion Tokens (MIK97)
          </Label>
          <Input
            type="number"
            min={0}
            step="0.00000001"
            value={trackTokens}
            onChange={(e) => setTrackTokens(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.music_track_tokens_input"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Album / Mixtape Completion Tokens (MIK97)
          </Label>
          <Input
            type="number"
            min={0}
            step="0.00000001"
            value={albumTokens}
            onChange={(e) => setAlbumTokens(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.music_album_tokens_input"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">
            Per-Content Cooldown (days)
          </Label>
          <Input
            type="number"
            min={0}
            step={0.5}
            value={cooldownDays}
            onChange={(e) => setCooldownDays(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.music_cooldown_input"
          />
          <p className="text-xs text-muted-foreground">
            Users cannot re-earn from the same content until this expires.
          </p>
        </div>
      </div>
      <SaveButton
        status={status}
        onClick={handleSave}
        ocid="reward_settings.music_save_button"
      />
    </div>
  );
}

// ── Live Milestones Section ───────────────────────────────────────────────────

type MilestoneRow = { seconds: number; tokens: number };

const DEFAULT_MILESTONES: MilestoneRow[] = [
  { seconds: 300, tokens: 2 },
  { seconds: 900, tokens: 5 },
  { seconds: 1800, tokens: 10 },
];

function LiveMilestonesSection() {
  const {
    data: config,
    isLoading,
    isError,
    refetch,
  } = useGetRewardRateConfig();
  const update = useUpdateRewardRateConfig();

  const [rows, setRows] = useState<MilestoneRow[]>(DEFAULT_MILESTONES);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  useEffect(() => {
    if (config && config.liveWatchMilestones.length > 0) {
      setRows(
        config.liveWatchMilestones.map(([secs, toks]) => ({
          seconds: Number(secs),
          tokens: Number(toks),
        })),
      );
    }
  }, [config]);

  const updateRow = (idx: number, field: keyof MilestoneRow, val: string) => {
    if (field === "tokens") {
      const n = safeFloat(val);
      setRows((prev) =>
        prev.map((r, i) => (i === idx ? { ...r, tokens: n < 0 ? 0 : n } : r)),
      );
    } else {
      const n = safeInt(val);
      setRows((prev) =>
        prev.map((r, i) => (i === idx ? { ...r, seconds: n < 0 ? 0 : n } : r)),
      );
    }
  };

  const handleSave = () => {
    if (!config) return;
    if (rows.some((r) => r.seconds <= 0)) {
      toast.error("All milestone second values must be positive.");
      return;
    }
    setStatus("saving");
    const milestonesSimple: Array<[bigint, number]> = rows.map((r) => [
      BigInt(Math.round(r.seconds)),
      r.tokens,
    ]);
    update.mutate(
      { ...config, liveWatchMilestones: milestonesSimple },
      {
        onSuccess: () => {
          setStatus("saved");
          toast.success("Live watch milestones updated.");
          setTimeout(() => setStatus("idle"), 3000);
        },
        onError: (err: Error) => {
          setStatus("error");
          toast.error(err.message || "Failed to save milestones.");
          setTimeout(() => setStatus("idle"), 3000);
        },
      },
    );
  };

  if (isLoading)
    return <div className="animate-pulse h-28 rounded bg-muted/30" />;

  if (isError)
    return (
      <SectionError
        label="Live Stream Watch Milestones"
        onRetry={() => void refetch()}
      />
    );

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div
            key={`ms-${row.seconds}-${i}`}
            className="grid grid-cols-2 gap-4 p-3 rounded-lg border border-border bg-muted/10"
            data-ocid={`reward_settings.milestone.${i + 1}`}
          >
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Milestone {i + 1} — Watch Seconds
              </Label>
              <Input
                type="number"
                min={1}
                value={row.seconds}
                onChange={(e) => updateRow(i, "seconds", e.target.value)}
                className="bg-background border-input"
                data-ocid={`reward_settings.milestone_secs.${i + 1}`}
              />
              <p className="text-xs text-muted-foreground">
                {`= ${Math.floor(row.seconds / 60)} min${row.seconds % 60 > 0 ? ` ${row.seconds % 60}s` : ""}`}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                MIK97 Reward
              </Label>
              <Input
                type="number"
                min={0}
                step="0.00000001"
                value={row.tokens}
                onChange={(e) => updateRow(i, "tokens", e.target.value)}
                className="bg-background border-input"
                data-ocid={`reward_settings.milestone_tokens.${i + 1}`}
              />
            </div>
          </div>
        ))}
      </div>
      <SaveButton
        status={status}
        onClick={handleSave}
        ocid="reward_settings.milestones_save_button"
      />
    </div>
  );
}

// ── Bonus Earning Controls Section ───────────────────────────────────────────

function BonusEarningSection() {
  const {
    data: config,
    isLoading,
    isError,
    refetch,
  } = useGetBonusEarningConfig();
  const update = useUpdateBonusEarningConfig();

  const [loginBonus, setLoginBonus] = useState("");
  const [streakBonus, setStreakBonus] = useState("");
  const [streakTarget, setStreakTarget] = useState("");
  const [showcaseBonus, setShowcaseBonus] = useState("");
  const [cashbackPct, setCashbackPct] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  useEffect(() => {
    if (config) {
      setLoginBonus(configToDisplay(config.loginBonusTokens));
      setStreakBonus(configToDisplay(config.streakBonusTokens));
      setStreakTarget(String(Number(config.streakTarget)));
      setShowcaseBonus(configToDisplay(config.showcaseUploadBonusTokens));
      setCashbackPct(configToDisplay(config.purchaseCashbackPercent));
    }
  }, [config]);

  const handleSave = () => {
    const loginVal = displayToConfigFloat(loginBonus);
    const streakVal = displayToConfigFloat(streakBonus);
    const streakTN = safeInt(streakTarget);
    const showcaseVal = displayToConfigFloat(showcaseBonus);
    const cashbackN = safeFloat(cashbackPct);
    if ([loginVal, streakVal, showcaseVal].some((v) => v < 0)) {
      toast.error("All token values must be non-negative numbers.");
      return;
    }
    if (streakTN <= 0) {
      toast.error("Streak target must be at least 1.");
      return;
    }
    if (cashbackN < 0) {
      toast.error("Cashback percent must be non-negative.");
      return;
    }
    setStatus("saving");

    // Always carry forward the current showcaseUploadRewardEnabled value (default true)
    // and mixtapeUploadRewardEnabled (default true) — we are not exposing these toggles
    // in this section to prevent save errors from missing backend keys.
    const newConfig: BonusEarningConfig = {
      loginBonusTokens: loginVal,
      streakBonusTokens: streakVal,
      streakTarget: BigInt(streakTN),
      showcaseUploadBonusTokens: showcaseVal,
      purchaseCashbackPercent: cashbackN,
      showcaseUploadRewardEnabled: config?.showcaseUploadRewardEnabled ?? true,
      mixtapeUploadRewardEnabled: config?.mixtapeUploadRewardEnabled ?? true,
    };
    update.mutate(newConfig, {
      onSuccess: () => {
        setStatus("saved");
        toast.success("Bonus earning settings updated.");
        setTimeout(() => setStatus("idle"), 3000);
      },
      onError: (err: Error) => {
        setStatus("error");
        toast.error(err.message || "Failed to save bonus settings.");
        setTimeout(() => setStatus("idle"), 3000);
      },
    });
  };

  if (isLoading)
    return <div className="animate-pulse h-28 rounded bg-muted/30" />;

  if (isError)
    return (
      <SectionError
        label="Bonus Earning Controls"
        onRetry={() => void refetch()}
      />
    );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5 text-primary" />
            Daily Login Bonus (MIK97)
          </Label>
          <Input
            type="number"
            min={0}
            step="0.00000001"
            value={loginBonus}
            onChange={(e) => setLoginBonus(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.login_bonus_input"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-primary" />
            Streak Bonus (MIK97)
          </Label>
          <Input
            type="number"
            min={0}
            step="0.00000001"
            value={streakBonus}
            onChange={(e) => setStreakBonus(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.streak_bonus_input"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-primary" />
            Streak Target (days)
          </Label>
          <Input
            type="number"
            min={1}
            value={streakTarget}
            onChange={(e) => setStreakTarget(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.streak_target_input"
          />
          <p className="text-xs text-muted-foreground">
            Days in a row required to trigger the streak bonus.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Upload className="h-3.5 w-3.5 text-primary" />
            Showcase Upload Bonus (MIK97)
          </Label>
          <Input
            type="number"
            min={0}
            step="0.00000001"
            value={showcaseBonus}
            onChange={(e) => setShowcaseBonus(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.showcase_bonus_input"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5 text-primary" />
            Purchase Cashback (%)
          </Label>
          <div className="relative">
            <Input
              type="number"
              min={0}
              max={100}
              value={cashbackPct}
              onChange={(e) => setCashbackPct(e.target.value)}
              className="bg-background border-input pr-8"
              data-ocid="reward_settings.cashback_pct_input"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              %
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            % of the beat price returned as MIK97 tokens after each paid
            purchase.
          </p>
        </div>
      </div>

      <SaveButton
        status={status}
        onClick={handleSave}
        ocid="reward_settings.bonus_earning_save_button"
      />
    </div>
  );
}

// ── Mixtape / Album Upload Reward Tiers ───────────────────────────────────────

function MixtapeRewardSection() {
  const {
    data: config,
    isLoading,
    isError,
    refetch,
  } = useGetMixtapeRewardConfig();
  const { data: bonusConfig } = useGetBonusEarningConfig();
  const updateMixtape = useUpdateMixtapeRewardConfigWithEnabled();

  const [tier1, setTier1] = useState("");
  const [tier2, setTier2] = useState("");
  const [tier3, setTier3] = useState("");
  const [tier4, setTier4] = useState("");
  const [dailyCap, setDailyCap] = useState("");
  const [mixtapeEnabled, setMixtapeEnabled] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  useEffect(() => {
    if (config) {
      setTier1(configToDisplay(config.tier1Tokens));
      setTier2(configToDisplay(config.tier2Tokens));
      setTier3(configToDisplay(config.tier3Tokens));
      setTier4(configToDisplay(config.tier4Tokens));
      setDailyCap(configToDisplay(config.dailyCap));
    }
  }, [config]);

  useEffect(() => {
    if (bonusConfig) {
      setMixtapeEnabled(bonusConfig.mixtapeUploadRewardEnabled ?? true);
    }
  }, [bonusConfig]);

  const handleSave = () => {
    // Explicit Number.parseFloat on all values before sending
    const t1 = Number.parseFloat(tier1);
    const t2 = Number.parseFloat(tier2);
    const t3 = Number.parseFloat(tier3);
    const t4 = Number.parseFloat(tier4);
    const cap = Number.parseFloat(dailyCap);
    if ([t1, t2, t3, t4, cap].some((v) => !Number.isFinite(v) || v < 0)) {
      toast.error("All values must be non-negative numbers.");
      return;
    }
    setStatus("saving");
    updateMixtape.mutate(
      {
        tier1Tokens: t1,
        tier2Tokens: t2,
        tier3Tokens: t3,
        tier4Tokens: t4,
        dailyCap: cap,
        enabled: mixtapeEnabled,
      },
      {
        onSuccess: () => {
          setStatus("saved");
          toast.success("Mixtape upload reward tiers updated.");
          setTimeout(() => setStatus("idle"), 3000);
        },
        onError: (err: Error) => {
          setStatus("error");
          toast.error(err.message || "Failed to save mixtape reward settings.");
          setTimeout(() => setStatus("idle"), 3000);
        },
      },
    );
  };

  if (isLoading)
    return <div className="animate-pulse h-40 rounded bg-muted/30" />;

  if (isError)
    return (
      <SectionError
        label="Mixtape / Album Upload Rewards"
        onRetry={() => void refetch()}
      />
    );

  const tiers = [
    {
      label: "1–5 Songs (MIK97)",
      value: tier1,
      setter: setTier1,
      ocid: "reward_settings.mixtape_tier1_input",
    },
    {
      label: "6–10 Songs (MIK97)",
      value: tier2,
      setter: setTier2,
      ocid: "reward_settings.mixtape_tier2_input",
    },
    {
      label: "11–15 Songs (MIK97)",
      value: tier3,
      setter: setTier3,
      ocid: "reward_settings.mixtape_tier3_input",
    },
    {
      label: "16–20 Songs (MIK97)",
      value: tier4,
      setter: setTier4,
      ocid: "reward_settings.mixtape_tier4_input",
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Reward earned by the uploader based on how many songs are on their
        mixtape or album. All amounts accept up to 8 decimal places.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tiers.map(({ label, value, setter, ocid }) => (
          <div key={label} className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5 text-primary" />
              {label}
            </Label>
            <Input
              type="number"
              min={0}
              step="0.00000001"
              value={value}
              onChange={(e) => setter(e.target.value)}
              className="bg-background border-input"
              data-ocid={ocid}
            />
          </div>
        ))}
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5 text-primary" />
            Daily Cap (MIK97)
          </Label>
          <Input
            type="number"
            min={0}
            step="0.00000001"
            value={dailyCap}
            onChange={(e) => setDailyCap(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.mixtape_daily_cap_input"
          />
          <p className="text-xs text-muted-foreground">
            Max MIK97 a user can earn from mixtape/album uploads per day.
          </p>
        </div>
      </div>

      {/* Mixtape Upload Reward Lock */}
      <RewardLockToggle
        enabled={mixtapeEnabled}
        onToggle={setMixtapeEnabled}
        label="Mixtape / Album Upload Rewards Active"
        note={
          mixtapeEnabled
            ? "Users earn MIK97 for mixtape/album uploads"
            : "Mixtape upload rewards are paused"
        }
        ocid="reward_settings.mixtape_reward_enabled_toggle"
      />

      <SaveButton
        status={status}
        onClick={handleSave}
        ocid="reward_settings.mixtape_save_button"
      />
    </div>
  );
}

// ── Beat Tier Discount Limits Section ────────────────────────────────────────

function BeatTierDiscountSection() {
  const {
    data: config,
    isLoading,
    isError,
    refetch,
  } = useGetBeatTierDiscountConfig();
  const update = useUpdateBeatTierDiscountConfig();
  const [local, setLocal] = useState<BeatTierDiscountConfig | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  useEffect(() => {
    if (config) setLocal(config);
  }, [config]);

  if (isLoading || !local)
    return <div className="animate-pulse h-40 rounded bg-muted/30" />;

  if (isError)
    return (
      <SectionError
        label="Beat Tier Discount Limits"
        onRetry={() => void refetch()}
      />
    );

  const tiers: {
    key: keyof BeatTierDiscountConfig;
    enabledKey: keyof BeatTierDiscountConfig;
    pctKey: keyof BeatTierDiscountConfig;
    label: string;
    ocidPrefix: string;
  }[] = [
    {
      key: "basicDiscountEnabled",
      enabledKey: "basicDiscountEnabled",
      pctKey: "basicMaxDiscountPercent",
      label: "Basic License",
      ocidPrefix: "reward_settings.tier_discount_basic",
    },
    {
      key: "premiumDiscountEnabled",
      enabledKey: "premiumDiscountEnabled",
      pctKey: "premiumMaxDiscountPercent",
      label: "Premium License",
      ocidPrefix: "reward_settings.tier_discount_premium",
    },
    {
      key: "exclusiveDiscountEnabled",
      enabledKey: "exclusiveDiscountEnabled",
      pctKey: "exclusiveMaxDiscountPercent",
      label: "Exclusive License",
      ocidPrefix: "reward_settings.tier_discount_exclusive",
    },
    {
      key: "stemsDiscountEnabled",
      enabledKey: "stemsDiscountEnabled",
      pctKey: "stemsMaxDiscountPercent",
      label: "Stems License",
      ocidPrefix: "reward_settings.tier_discount_stems",
    },
  ];

  const handleSave = () => {
    if (!local) return;
    setStatus("saving");
    update.mutate(local, {
      onSuccess: () => {
        setStatus("saved");
        toast.success("Beat tier discount limits saved.");
        setTimeout(() => setStatus("idle"), 3000);
      },
      onError: (err: Error) => {
        setStatus("error");
        toast.error(err.message || "Failed to save discount limits.");
        setTimeout(() => setStatus("idle"), 3000);
      },
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Control whether MIK97 discounts are available per license tier and set
        the maximum discount percentage allowed.
      </p>
      <div className="space-y-3">
        {tiers.map(({ enabledKey, pctKey, label, ocidPrefix }) => {
          const isEnabled = local[enabledKey] as boolean;
          const pctVal = local[pctKey] as number;
          return (
            <div
              key={label}
              className="p-3 rounded-lg border border-border bg-muted/10 space-y-2"
              data-ocid={`${ocidPrefix}.row`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${isEnabled ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
                  />
                  <span
                    className={`text-sm font-medium ${isEnabled ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {label}
                  </span>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(val) =>
                    setLocal((p) => (p ? { ...p, [enabledKey]: val } : p))
                  }
                  data-ocid={`${ocidPrefix}.toggle`}
                />
              </div>
              {isEnabled && (
                <div className="flex items-center gap-3 pt-1">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                    Max Discount %
                  </Label>
                  <div className="relative flex-1 max-w-[160px]">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={pctVal}
                      onChange={(e) => {
                        const n = safeFloat(e.target.value);
                        setLocal((p) =>
                          p
                            ? {
                                ...p,
                                [pctKey]: Math.max(
                                  0,
                                  Math.min(100, n < 0 ? 0 : n),
                                ),
                              }
                            : p,
                        );
                      }}
                      className="bg-background border-input pr-8 text-sm h-8"
                      data-ocid={`${ocidPrefix}.pct_input`}
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Max {pctVal.toFixed(2)}% off per beat
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <SaveButton
        status={status}
        onClick={handleSave}
        ocid="reward_settings.tier_discount_save_button"
      />
    </div>
  );
}

// ── Dynamic Ratio System Section ──────────────────────────────────────────────

function DynamicRatioSection() {
  const {
    data: config,
    isLoading,
    isError,
    refetch,
  } = useGetDynamicRatioConfig();
  const update = useUpdateDynamicRatioConfig();

  const [localEnabled, setLocalEnabled] = useState(false);
  const [localPrice, setLocalPrice] = useState("0.01");
  const [localMode, setLocalMode] = useState<"Fixed" | "Dynamic">("Fixed");
  const [localRewardMode, setLocalRewardMode] = useState<"Fixed" | "Dynamic">(
    "Fixed",
  );
  const [localPriceSource, setLocalPriceSource] = useState<"manual" | "live">(
    "manual",
  );
  const [perSectionMode, setPerSectionMode] = useState<PerSectionRewardMode>(
    {},
  );
  const [dollarValues, setDollarValues] = useState<DollarValueConfig>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [showPreview, setShowPreview] = useState(false);

  const SECTIONS = [
    { key: "Games", icon: <Gamepad2 className="h-3.5 w-3.5" /> },
    { key: "Music Listening", icon: <Music className="h-3.5 w-3.5" /> },
    { key: "Live Watch", icon: <Tv className="h-3.5 w-3.5" /> },
    { key: "Showcase Upload", icon: <Upload className="h-3.5 w-3.5" /> },
    { key: "Mixtape Upload", icon: <Star className="h-3.5 w-3.5" /> },
    { key: "Forum Posts", icon: <Gift className="h-3.5 w-3.5" /> },
    { key: "Bonus Actions", icon: <Zap className="h-3.5 w-3.5" /> },
  ];

  useEffect(() => {
    if (config) {
      setLocalEnabled(config.isEnabled);
      setLocalPrice(String(config.tokenPriceUsd));
      setLocalMode(config.discountMode);
      setLocalRewardMode(config.rewardMode ?? "Fixed");
      setLocalPriceSource(config.priceSource ?? "manual");
      setPerSectionMode(config.perSectionRewardMode ?? {});
      setDollarValues(config.dollarValueConfig ?? {});
    }
  }, [config]);

  const previewParams = {
    tokenPriceUsd: Number.parseFloat(localPrice) || 0.01,
    rewardMode: localRewardMode,
    perSectionRewardMode: perSectionMode,
    dollarValueConfig: dollarValues,
  };
  const { data: preview, refetch: refetchPreview } =
    useGetDynamicRewardPreview(previewParams);

  const handleSave = () => {
    const priceN = Number.parseFloat(localPrice);
    if (Number.isNaN(priceN) || priceN < 0) {
      toast.error("Token price must be a positive number.");
      return;
    }
    const newConfig: DynamicRatioConfig = {
      isEnabled: localEnabled,
      tokenPriceUsd: priceN,
      priceLastUpdated: BigInt(Date.now()) * 1_000_000n,
      discountMode: localMode,
      rewardMode: localRewardMode,
      perSectionRewardMode: perSectionMode,
      dollarValueConfig: dollarValues,
      priceSource: localPriceSource,
    };
    setStatus("saving");
    update.mutate(newConfig, {
      onSuccess: () => {
        setStatus("saved");
        toast.success("Dynamic ratio settings saved.");
        setTimeout(() => setStatus("idle"), 3000);
      },
      onError: (err: Error) => {
        setStatus("error");
        toast.error(err.message || "Failed to save.");
        setTimeout(() => setStatus("idle"), 3000);
      },
    });
  };

  function setSectionMode(name: string, mode: "Fixed" | "Dynamic") {
    setPerSectionMode((prev) => ({ ...prev, [name]: mode }));
  }

  function setDollarValue(name: string, val: string) {
    const n = Number.parseFloat(val);
    setDollarValues((prev) => ({ ...prev, [name]: Number.isNaN(n) ? 0 : n }));
  }

  function formatTokenPayout(n: number): string {
    if (!Number.isFinite(n) || n === 0) return "0";
    return Number.parseFloat(n.toFixed(8)).toString();
  }

  if (isLoading)
    return <div className="animate-pulse h-28 rounded bg-muted/30" />;
  if (isError)
    return (
      <SectionError
        label="Dynamic Ratio System"
        onRetry={() => void refetch()}
      />
    );

  return (
    <div
      className="space-y-6"
      data-ocid="reward_settings.dynamic_ratio_section"
    >
      {/* Status banner */}
      <div
        className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
          localEnabled
            ? "border-emerald-500/40 bg-emerald-500/10"
            : "border-yellow-500/30 bg-yellow-500/5"
        }`}
      >
        {localEnabled ? (
          <Zap className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <Info className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
        )}
        <p
          className={`text-xs leading-relaxed ${
            localEnabled ? "text-emerald-300" : "text-yellow-400"
          }`}
        >
          {localEnabled ? (
            <>
              <span className="font-semibold">ACTIVE — Dynamic Mode.</span>{" "}
              Reward amounts and discounts auto-scale with the MIK97 token
              price. Toggle sections individually below.
            </>
          ) : (
            <>
              <span className="font-semibold">INACTIVE — Exchange Mode.</span>{" "}
              When enabled, discount amounts and reward rates automatically
              adjust based on the live MIK97 token price. Until then, the
              platform uses the fixed rate (100 MIK97 = $1 off).
            </>
          )}
        </p>
      </div>

      {/* Enable toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div>
          <Label
            className={`font-medium ${localEnabled ? "text-foreground" : "text-muted-foreground"}`}
          >
            Enable Dynamic Ratio System
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            {localEnabled
              ? "Active — discounts and rewards scale with live token price"
              : "Inactive — activate when MIK97 is listed on an exchange"}
          </p>
        </div>
        <Switch
          checked={localEnabled}
          onCheckedChange={setLocalEnabled}
          data-ocid="reward_settings.dynamic_ratio_toggle"
        />
      </div>

      {/* Core settings grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Token Price */}
        <div className="space-y-1.5">
          <Label
            className={`text-xs ${localEnabled ? "text-muted-foreground" : "text-muted-foreground/50"}`}
          >
            <TrendingUp className="h-3.5 w-3.5 inline mr-1" />
            Token Price (USD)
          </Label>
          <Input
            type="number"
            min={0}
            step={0.00000001}
            value={localPrice}
            onChange={(e) => setLocalPrice(e.target.value)}
            disabled={!localEnabled}
            className="bg-background border-input disabled:opacity-40"
            placeholder="e.g. 0.01"
            data-ocid="reward_settings.dynamic_ratio_price_input"
          />
          <p className="text-xs text-muted-foreground">
            {localEnabled && Number.parseFloat(localPrice) > 0
              ? `1 MIK97 = $${Number.parseFloat(localPrice)
                  .toFixed(8)
                  .replace(/\.?0+$/, "")}`
              : "Set price when exchange listing is live"}
          </p>
        </div>

        {/* Discount Mode */}
        <div className="space-y-1.5">
          <Label
            className={`text-xs ${localEnabled ? "text-muted-foreground" : "text-muted-foreground/50"}`}
          >
            Discount Mode
          </Label>
          <Select
            value={localMode}
            onValueChange={(v) => setLocalMode(v as "Fixed" | "Dynamic")}
            disabled={!localEnabled}
          >
            <SelectTrigger
              className="bg-background border-input disabled:opacity-40"
              data-ocid="reward_settings.dynamic_ratio_mode_select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="Fixed">
                Fixed Tiers (100 MIK97 = $1)
              </SelectItem>
              <SelectItem value="Dynamic">
                Percentage-Based (scales with price)
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {localMode === "Dynamic"
              ? "Discount amounts auto-adjust so % savings stays consistent"
              : "Fixed amounts: 500 tokens = $5, 1000 = $10, etc."}
          </p>
        </div>

        {/* Price Source */}
        <div className="space-y-1.5">
          <Label
            className={`text-xs ${localEnabled ? "text-muted-foreground" : "text-muted-foreground/50"}`}
          >
            Price Source
          </Label>
          <Select
            value={localPriceSource}
            onValueChange={(v) => setLocalPriceSource(v as "manual" | "live")}
            disabled={!localEnabled}
          >
            <SelectTrigger
              className="bg-background border-input disabled:opacity-40"
              data-ocid="reward_settings.dynamic_ratio_price_source_select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="manual">Manual Entry</SelectItem>
              <SelectItem value="live" disabled>
                Live Feed (post-exchange listing)
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {localPriceSource === "live"
              ? "Auto-fetches price from ICPSwap (coming after listing)"
              : "Admin sets token price manually"}
          </p>
        </div>
      </div>

      {/* Global Reward Mode */}
      <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label
              className={`font-medium ${localEnabled ? "text-foreground" : "text-muted-foreground/50"}`}
            >
              <ToggleLeft className="h-4 w-4 inline mr-1.5" />
              Global Reward Mode
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fixed: all sections use token amounts you set directly. Dynamic:
              sections pay out a fixed USD value converted at current price.
            </p>
          </div>
          <Select
            value={localRewardMode}
            onValueChange={(v) => setLocalRewardMode(v as "Fixed" | "Dynamic")}
            disabled={!localEnabled}
          >
            <SelectTrigger
              className="w-44 bg-background border-input disabled:opacity-40"
              data-ocid="reward_settings.dynamic_ratio_reward_mode_select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="Fixed">
                <span className="flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5" />
                  Fixed Token Amount
                </span>
              </SelectItem>
              <SelectItem value="Dynamic">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Dynamic Dollar Value
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Per-Section Reward Mode Overrides */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label
            className={`text-sm font-medium ${localEnabled ? "text-foreground" : "text-muted-foreground/50"}`}
          >
            Per-Section Reward Mode
          </Label>
          <p className="text-xs text-muted-foreground">
            Override global mode for individual sections
          </p>
        </div>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">
                  Section
                </th>
                <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">
                  Mode
                </th>
                <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">
                  USD Value / Action
                </th>
              </tr>
            </thead>
            <tbody>
              {SECTIONS.map(({ key, icon }, idx) => {
                const sectionMode = perSectionMode[key] ?? localRewardMode;
                const isDynamic = sectionMode === "Dynamic";
                return (
                  <tr
                    key={key}
                    className={`border-b border-border last:border-0 ${
                      idx % 2 === 0 ? "bg-background" : "bg-muted/10"
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      <span
                        className={`flex items-center gap-2 ${localEnabled ? "text-foreground" : "text-muted-foreground/50"}`}
                      >
                        {icon}
                        <span className="text-xs font-medium">{key}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Select
                        value={sectionMode}
                        onValueChange={(v) =>
                          setSectionMode(key, v as "Fixed" | "Dynamic")
                        }
                        disabled={!localEnabled}
                      >
                        <SelectTrigger
                          className="h-7 w-32 text-xs bg-background border-input disabled:opacity-40"
                          data-ocid={`reward_settings.dynamic_ratio.section_mode_${idx + 1}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="Fixed">Fixed Token</SelectItem>
                          <SelectItem value="Dynamic">Dynamic $</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-2.5">
                      <Input
                        type="number"
                        min={0}
                        step={0.00000001}
                        value={dollarValues[key] ?? ""}
                        onChange={(e) => setDollarValue(key, e.target.value)}
                        disabled={!localEnabled || !isDynamic}
                        placeholder={isDynamic ? "e.g. 0.05" : "(fixed mode)"}
                        className="h-7 w-28 text-xs bg-background border-input disabled:opacity-40"
                        data-ocid={`reward_settings.dynamic_ratio.section_usd_${idx + 1}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Preview */}
      {localEnabled && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-primary" />
              Live Payout Preview
            </Label>
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => void refetchPreview()}
              data-ocid="reward_settings.dynamic_ratio_preview_refresh"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
          </div>
          <button
            type="button"
            className="text-xs text-primary underline underline-offset-2 hover:text-primary/80"
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? "Hide preview" : "Show preview"}
          </button>
          {showPreview && (
            <div className="space-y-1.5 mt-2">
              {(preview ?? []).map((entry) => (
                <div
                  key={entry.sectionName}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground w-36 truncate">
                    {entry.sectionName}
                  </span>
                  {entry.currentMode === "Dynamic" ? (
                    <span className="text-foreground font-mono">
                      {formatTokenPayout(entry.tokenPayout)}{" "}
                      <span className="text-muted-foreground">MIK97</span>
                      <span className="text-muted-foreground ml-1">
                        (= ${entry.usdValue.toFixed(8).replace(/\.?0+$/, "")} @
                        ${entry.tokenPriceUsd.toFixed(8).replace(/\.?0+$/, "")}
                        /MIK97)
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground/60 italic">
                      Fixed token mode — no dynamic conversion
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <SaveButton
        status={status}
        onClick={handleSave}
        ocid="reward_settings.dynamic_ratio_save_button"
      />
    </div>
  );
}

// ── Reward Section Controls (master pause toggles) ────────────────────────────

const SECTION_TOGGLE_DEFS: {
  field: keyof import("../../types/treasury").RewardSectionToggles;
  label: string;
  icon: React.ReactNode;
  ocid: string;
}[] = [
  {
    field: "gameRewardsEnabled",
    label: "Jumper Game Rewards",
    icon: <Gamepad2 className="h-3.5 w-3.5 text-primary" />,
    ocid: "reward_settings.toggle.jumper",
  },
  {
    field: "flappyRewardsEnabled",
    label: "Flappy Game Rewards",
    icon: <Gamepad2 className="h-3.5 w-3.5 text-primary" />,
    ocid: "reward_settings.toggle.flappy",
  },
  {
    field: "musicRewardsEnabled",
    label: "Music Listening Rewards",
    icon: <Music className="h-3.5 w-3.5 text-primary" />,
    ocid: "reward_settings.toggle.music",
  },
  {
    field: "liveRewardsEnabled",
    label: "Live Watch Rewards",
    icon: <Tv className="h-3.5 w-3.5 text-primary" />,
    ocid: "reward_settings.toggle.live",
  },
  {
    field: "showcaseRewardsEnabled",
    label: "Showcase Upload Rewards",
    icon: <Upload className="h-3.5 w-3.5 text-primary" />,
    ocid: "reward_settings.toggle.showcase",
  },
  {
    field: "mixtapeRewardsEnabled",
    label: "Mixtape Upload Rewards",
    icon: <Upload className="h-3.5 w-3.5 text-primary" />,
    ocid: "reward_settings.toggle.mixtape",
  },
  {
    field: "forumRewardsEnabled",
    label: "Forum Post Rewards",
    icon: <Gift className="h-3.5 w-3.5 text-primary" />,
    ocid: "reward_settings.toggle.forum",
  },
  {
    field: "bonusActionsEnabled",
    label: "Bonus Actions",
    icon: <Star className="h-3.5 w-3.5 text-primary" />,
    ocid: "reward_settings.toggle.bonus",
  },
];

function RewardSectionControls() {
  const { data: toggles, isLoading } = useGetRewardSectionToggles();
  const update = useUpdateRewardSectionToggles();

  function handleToggle(
    field: keyof import("../../types/treasury").RewardSectionToggles,
    val: boolean,
  ) {
    if (!toggles) return;
    const next = { ...toggles, [field]: val };
    update.mutate(next, {
      onSuccess: () =>
        toast.success(`${val ? "Enabled" : "Paused"} — changes saved.`),
      onError: (e: Error) =>
        toast.error(e.message || "Failed to update toggle."),
    });
  }

  if (isLoading)
    return <div className="animate-pulse h-40 rounded bg-muted/30" />;

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      data-ocid="reward_settings.section_controls"
    >
      {SECTION_TOGGLE_DEFS.map(({ field, label, icon, ocid }) => {
        const enabled = toggles ? toggles[field] : true;
        return (
          <div
            key={field}
            className={`flex items-start justify-between rounded-lg border p-3 gap-3 transition-colors ${enabled ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/30 bg-destructive/5"}`}
            data-ocid={`${ocid}.row`}
          >
            <div className="flex items-start gap-2 min-w-0">
              <div className="mt-0.5 shrink-0">{icon}</div>
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium leading-tight ${enabled ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  {enabled
                    ? "Active — users earn from this section"
                    : "Paused — payouts stopped at server level"}
                </p>
              </div>
            </div>
            <Switch
              checked={!!enabled}
              onCheckedChange={(v) => handleToggle(field, v)}
              disabled={update.isPending}
              data-ocid={ocid}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── Forum Rewards Section ─────────────────────────────────────────────────────

function ForumRewardsSection() {
  const {
    data: config,
    isLoading,
    isError,
    refetch,
  } = useGetForumRewardConfig();
  const { data: toggles } = useGetRewardSectionToggles();
  const updateForum = useUpdateForumRewardConfig();
  const updateToggles = useUpdateRewardSectionToggles();

  const [tokensPerMsg, setTokensPerMsg] = useState("");
  const [dailyCap, setDailyCap] = useState("");
  const [everyN, setEveryN] = useState("1");
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  useEffect(() => {
    if (config) {
      setTokensPerMsg(configToDisplay(config.tokensPerMessage));
      setDailyCap(configToDisplay(config.dailyEarningCap));
      setEveryN(String(Number(config.rewardEveryNMessages)));
      setEnabled(config.isEnabled);
    }
  }, [config]);

  // Sync enabled with toggles
  useEffect(() => {
    if (toggles) setEnabled(toggles.forumRewardsEnabled);
  }, [toggles]);

  const handleSave = () => {
    const tokensN = displayToConfigFloat(tokensPerMsg);
    const capN = displayToConfigFloat(dailyCap);
    const nN = safeInt(everyN);
    if (tokensN < 0 || capN < 0) {
      toast.error("Token values must be non-negative.");
      return;
    }
    if (nN <= 0) {
      toast.error("'Reward every N messages' must be at least 1.");
      return;
    }
    setStatus("saving");
    const newConfig: ForumRewardConfig = {
      tokensPerMessage: tokensN,
      dailyEarningCap: capN,
      rewardEveryNMessages: BigInt(nN),
      isEnabled: enabled,
    };
    updateForum.mutate(newConfig, {
      onSuccess: () => {
        // Also sync the forumRewardsEnabled toggle
        if (toggles) {
          updateToggles.mutate({ ...toggles, forumRewardsEnabled: enabled });
        }
        setStatus("saved");
        toast.success("Forum reward settings saved.");
        setTimeout(() => setStatus("idle"), 3000);
      },
      onError: (e: Error) => {
        setStatus("error");
        toast.error(e.message || "Failed to save forum reward settings.");
        setTimeout(() => setStatus("idle"), 3000);
      },
    });
  };

  if (isLoading)
    return <div className="animate-pulse h-32 rounded bg-muted/30" />;
  if (isError)
    return (
      <SectionError label="Forum Rewards" onRetry={() => void refetch()} />
    );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
        Decimal amounts down to{" "}
        <span className="font-mono text-foreground">0.00000001</span> MIK97 are
        supported.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5 text-primary" />
            Tokens Per Message (MIK97)
          </Label>
          <Input
            type="number"
            min={0}
            step="0.00000001"
            value={tokensPerMsg}
            onChange={(e) => setTokensPerMsg(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.forum_tokens_per_msg_input"
          />
          <p className="text-xs text-muted-foreground">
            Current: {configToDisplay(config?.tokensPerMessage ?? 0)} MIK97
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5 text-primary" />
            Daily Earning Cap Per User (MIK97)
          </Label>
          <Input
            type="number"
            min={0}
            step="0.00000001"
            value={dailyCap}
            onChange={(e) => setDailyCap(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.forum_daily_cap_input"
          />
          <p className="text-xs text-muted-foreground">
            Current: {configToDisplay(config?.dailyEarningCap ?? 0)} MIK97/day
          </p>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5 text-primary" />
            Reward Every X Messages Posted
          </Label>
          <Input
            type="number"
            min={1}
            step="1"
            value={everyN}
            onChange={(e) => setEveryN(e.target.value)}
            className="bg-background border-input"
            data-ocid="reward_settings.forum_every_n_input"
          />
          <p className="text-xs text-muted-foreground">
            e.g. 1 = every message, 5 = every 5th message
          </p>
        </div>
      </div>

      <RewardLockToggle
        enabled={enabled}
        onToggle={setEnabled}
        label="Forum Post Rewards Active"
        note={
          enabled
            ? "Users earn MIK97 for forum messages"
            : "Forum post rewards are paused"
        }
        ocid="reward_settings.forum_enabled_toggle"
      />

      <SaveButton
        status={status}
        onClick={handleSave}
        ocid="reward_settings.forum_save_button"
      />
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

function RewardSettingsPanelInner() {
  return (
    <div className="space-y-6" data-ocid="reward_settings.panel">
      {/* Reward Section Controls */}
      <Card
        className="bg-card border-primary/30 border-2"
        data-ocid="reward_settings.section_controls_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2 text-base">
            <Coins className="h-4 w-4" />
            Reward Section Controls
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              Pause any section to stop payouts — users can still use the
              feature
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RewardSectionControls />
        </CardContent>
      </Card>

      {/* Daily Caps */}
      <Card
        className="bg-card border-border"
        data-ocid="reward_settings.caps_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2 text-base">
            <Coins className="h-4 w-4" />
            Daily Earning Caps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DailyCapsSection />
        </CardContent>
      </Card>

      {/* Game Ratios */}
      <Card
        className="bg-card border-border"
        data-ocid="reward_settings.game_ratios_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2 text-base">
            <Gamepad2 className="h-4 w-4" />
            Game Earning Ratios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GameRatiosSection />
        </CardContent>
      </Card>

      {/* Music Rewards */}
      <Card
        className="bg-card border-border"
        data-ocid="reward_settings.music_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2 text-base">
            <Music className="h-4 w-4" />
            Music Listening Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MusicRewardsSection />
        </CardContent>
      </Card>

      {/* Live Milestones */}
      <Card
        className="bg-card border-border"
        data-ocid="reward_settings.milestones_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2 text-base">
            <Tv className="h-4 w-4" />
            Live Stream Watch Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LiveMilestonesSection />
        </CardContent>
      </Card>

      {/* Bonus Earning Controls */}
      <Card
        className="bg-card border-border"
        data-ocid="reward_settings.bonus_earning_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2 text-base">
            <Gift className="h-4 w-4" />
            Bonus Earning Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BonusEarningSection />
        </CardContent>
      </Card>

      {/* Mixtape / Album Upload Rewards */}
      <Card
        className="bg-card border-border"
        data-ocid="reward_settings.mixtape_reward_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2 text-base">
            <Upload className="h-4 w-4" />
            Mixtape / Album Upload Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MixtapeRewardSection />
        </CardContent>
      </Card>

      {/* Beat Tier Discount Limits */}
      <Card
        className="bg-card border-border"
        data-ocid="reward_settings.tier_discount_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2 text-base">
            <Percent className="h-4 w-4" />
            Beat Tier Discount Limits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BeatTierDiscountSection />
        </CardContent>
      </Card>

      {/* Forum Rewards */}
      <Card
        className="bg-card border-border"
        data-ocid="reward_settings.forum_reward_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2 text-base">
            <Gift className="h-4 w-4" />
            Forum Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ForumRewardsSection />
        </CardContent>
      </Card>

      {/* Staking Vault Config */}
      <Card
        className="bg-card border-border"
        data-ocid="reward_settings.staking_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            Staking Vault Config
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StakingConfigSection />
        </CardContent>
      </Card>

      {/* Dynamic Ratio System */}
      <Card
        className="bg-card border-border"
        data-ocid="reward_settings.dynamic_ratio_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Dynamic Ratio System
            <span className="ml-auto text-xs font-normal text-yellow-500 border border-yellow-500/40 rounded px-1.5 py-0.5">
              INACTIVE — Exchange Mode
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DynamicRatioSection />
        </CardContent>
      </Card>
    </div>
  );
}

export default function RewardSettingsPanel() {
  return (
    <ErrorBoundary sectionLabel="Reward Settings">
      <RewardSettingsPanelInner />
    </ErrorBoundary>
  );
}
