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
import { CheckCircle2, Info, Music2, RefreshCw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useGetNextPoLResetTime,
  useGetPoLConfig,
  useGetPoLResetConfig,
  useSetPoLConfig,
  useSetPoLResetConfig,
} from "../../hooks/useQueries";
import type { PoLConfig, PoLResetConfig } from "../../types/pol";

// ── Save Button ───────────────────────────────────────────────────────────────

function SaveButton({
  status,
  onClick,
  ocid,
  label = "Save Changes",
}: {
  status: "idle" | "saving" | "saved" | "error";
  onClick: () => void;
  ocid: string;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        onClick={onClick}
        disabled={status === "saving"}
        className="bg-primary text-primary-foreground"
        data-ocid={ocid}
      >
        {status === "saving" ? "Saving…" : label}
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

// ── PoL Core Settings ─────────────────────────────────────────────────────────

function PoLCoreSettings() {
  const { data: polConfig, isLoading } = useGetPoLConfig();
  const setPolConfig = useSetPoLConfig();

  const [enabled, setEnabled] = useState(true);
  const [minConfidence, setMinConfidence] = useState("10");
  const [rewardMultiplier, setRewardMultiplier] = useState("1.0");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  useEffect(() => {
    if (polConfig) {
      setEnabled(polConfig.enabled);
      setMinConfidence(String(polConfig.minConfidenceThreshold));
      setRewardMultiplier(String(polConfig.rewardMultiplier));
    }
  }, [polConfig]);

  const handleSave = () => {
    const minConf = Math.max(0, Math.min(100, Number(minConfidence) || 0));
    const mult = Math.max(0, Math.min(2, Number(rewardMultiplier) || 1));
    const config: PoLConfig = {
      enabled,
      minConfidenceThreshold: minConf,
      rewardMultiplier: mult,
      bronzeThreshold: 1,
      silverThreshold: 34,
      goldThreshold: 67,
    };
    setStatus("saving");
    setPolConfig.mutate(config, {
      onSuccess: () => {
        setStatus("saved");
        toast.success("PoL settings saved.");
        setTimeout(() => setStatus("idle"), 3000);
      },
      onError: (err: Error) => {
        setStatus("error");
        toast.error(err.message || "Failed to save PoL settings.");
        setTimeout(() => setStatus("idle"), 3000);
      },
    });
  };

  if (isLoading)
    return <div className="animate-pulse h-24 rounded bg-muted/30" />;

  return (
    <div className="space-y-4">
      {/* Enable toggle */}
      <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 border border-border px-3 py-2.5">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Enable PoL Verification
          </p>
          <p className="text-xs text-muted-foreground">
            When enabled, music reward payouts are multiplied by the confidence
            score
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={setEnabled}
          data-ocid="layer1.pol.enable_toggle"
        />
      </div>

      {/* Confidence threshold */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Minimum Confidence Threshold (%)
        </Label>
        <Input
          type="number"
          min={0}
          max={100}
          value={minConfidence}
          onChange={(e) => setMinConfidence(e.target.value)}
          className="bg-background border-input text-foreground max-w-[160px]"
          data-ocid="layer1.pol.min_confidence_input"
        />
        <p className="text-xs text-muted-foreground">
          Sessions below this threshold receive no reward (0 = all sessions
          qualify)
        </p>
      </div>

      {/* Reward multiplier */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Reward Multiplier (0.0 – 2.0)
        </Label>
        <Input
          type="number"
          min={0}
          max={2}
          step={0.1}
          value={rewardMultiplier}
          onChange={(e) => setRewardMultiplier(e.target.value)}
          className="bg-background border-input text-foreground max-w-[160px]"
          data-ocid="layer1.pol.multiplier_input"
        />
        <p className="text-xs text-muted-foreground">
          1.0 = 100% of base reward. 0.5 = half. 1.5 = 50% bonus for
          high-confidence listeners.
        </p>
      </div>

      <SaveButton
        status={status}
        onClick={handleSave}
        ocid="layer1.pol.save_button"
        label="Save PoL Settings"
      />
    </div>
  );
}

// ── Badge Tiers (read-only) ───────────────────────────────────────────────────

function BadgeTierDisplay() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Badge tiers are split equally into three equal fractions of the 0–100%
        confidence score range. Badges are awarded based on the listener&apos;s
        average confidence across sessions.
      </p>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-[#CD7F32]/40 bg-[#2a1a0a] py-3 px-2">
          <p className="text-sm font-bold" style={{ color: "#CD7F32" }}>
            🥉 Bronze
          </p>
          <p className="text-xs text-muted-foreground mt-1">1% – 33%</p>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
            Low confidence
          </p>
        </div>
        <div className="rounded-lg border border-[#C0C0C0]/40 bg-[#1a1a1a] py-3 px-2">
          <p className="text-sm font-bold" style={{ color: "#C0C0C0" }}>
            🥈 Silver
          </p>
          <p className="text-xs text-muted-foreground mt-1">34% – 66%</p>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
            Moderate confidence
          </p>
        </div>
        <div className="rounded-lg border border-[#FFD700]/40 bg-[#1a1500] py-3 px-2">
          <p className="text-sm font-bold" style={{ color: "#FFD700" }}>
            🥇 Gold
          </p>
          <p className="text-xs text-muted-foreground mt-1">67% – 100%</p>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
            High confidence
          </p>
        </div>
      </div>
      <div className="flex items-start gap-2 rounded-md bg-muted/20 border border-border px-3 py-2 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
        <span>
          Tier thresholds are fixed at equal thirds and cannot be changed.
          Multipliers per tier are set by the Reward Multiplier above.
        </span>
      </div>
    </div>
  );
}

// ── Tier Reset Settings ───────────────────────────────────────────────────────

function TierResetSettings() {
  const { data: resetConfig } = useGetPoLResetConfig();
  const setResetConfig = useSetPoLResetConfig();
  const { data: nextResetTimeMs } = useGetNextPoLResetTime();

  const [resetEnabled, setResetEnabled] = useState(false);
  const [resetIntervalDays, setResetIntervalDays] = useState("7");
  const [resetTimeOfDayHours, setResetTimeOfDayHours] = useState("0");
  const [resetStatus, setResetStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  useEffect(() => {
    if (resetConfig) {
      setResetEnabled(resetConfig.resetEnabled);
      setResetIntervalDays(String(resetConfig.resetIntervalDays));
      setResetTimeOfDayHours(String(resetConfig.resetTimeOfDayHours));
    }
  }, [resetConfig]);

  const handleSaveReset = () => {
    const days = Math.max(1, Math.min(30, Number(resetIntervalDays) || 7));
    const hours = Math.max(0, Math.min(23, Number(resetTimeOfDayHours) || 0));
    const config: PoLResetConfig = {
      resetEnabled,
      resetIntervalDays: days,
      resetTimeOfDayHours: hours,
    };
    setResetStatus("saving");
    setResetConfig.mutate(config, {
      onSuccess: () => {
        setResetStatus("saved");
        toast.success("Tier reset settings saved.");
        setTimeout(() => setResetStatus("idle"), 3000);
      },
      onError: (err: Error) => {
        setResetStatus("error");
        toast.error(err.message || "Failed to save reset settings.");
        setTimeout(() => setResetStatus("idle"), 3000);
      },
    });
  };

  function formatNextReset(tsMs: number): string {
    if (!tsMs || tsMs <= 0) return "Not scheduled";
    return new Date(tsMs).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  }

  const UTC_HOURS = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-4">
      {/* Reset enable toggle */}
      <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 border border-border px-3 py-2.5">
        <div>
          <p className="text-sm font-medium text-foreground">
            Enable Tier Reset
          </p>
          <p className="text-xs text-muted-foreground">
            {resetEnabled
              ? "Users' tiers reset on schedule — prevents farming on top tier"
              : "Reset is off — users keep their tier indefinitely"}
          </p>
        </div>
        <Switch
          checked={resetEnabled}
          onCheckedChange={setResetEnabled}
          data-ocid="layer1.pol.reset_enabled_toggle"
        />
      </div>

      {resetEnabled && (
        <div className="space-y-3 pl-1">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Reset Interval (days)
            </Label>
            <Input
              type="number"
              min={1}
              max={30}
              value={resetIntervalDays}
              onChange={(e) => setResetIntervalDays(e.target.value)}
              className="bg-background border-input text-foreground max-w-[140px]"
              data-ocid="layer1.pol.reset_interval_input"
            />
            <p className="text-xs text-muted-foreground">
              How often the tier reset runs (1–30 days)
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Reset Time (UTC hour)
            </Label>
            <Select
              value={String(resetTimeOfDayHours)}
              onValueChange={(v) => setResetTimeOfDayHours(v)}
            >
              <SelectTrigger
                className="bg-background border-input max-w-[180px]"
                data-ocid="layer1.pol.reset_time_select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border max-h-56">
                {UTC_HOURS.map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {String(h).padStart(2, "0")}:00 UTC
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Next reset info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Info className="h-3 w-3 shrink-0" />
        <span>
          Next reset:{" "}
          <span className="text-foreground font-medium">
            {formatNextReset(nextResetTimeMs ?? 0)}
          </span>
        </span>
      </div>

      <p className="text-xs text-muted-foreground bg-muted/30 rounded px-3 py-2 leading-relaxed">
        When a reset runs, each listener&apos;s badge tier is recalculated based
        on their last 7 days of listening activity. Listeners who keep listening
        consistently keep their tier — those who stop will drop back.
      </p>

      <SaveButton
        status={resetStatus}
        onClick={handleSaveReset}
        ocid="layer1.pol.reset_save_button"
        label="Save Reset Settings"
      />
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function Layer1SettingsPanel() {
  return (
    <div className="space-y-6" data-ocid="layer1.panel">
      {/* Header */}
      <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
        <Music2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Layer 1 — Proof of Listening
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage playback continuity tracking and verified listener badge
            settings. Sessions below the minimum confidence threshold earn no
            reward.
          </p>
        </div>
      </div>

      {/* PoL Core Settings */}
      <Card
        className="bg-card border-border"
        data-ocid="layer1.core_settings_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2 text-base">
            <Music2 className="h-4 w-4" />
            PoL Core Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PoLCoreSettings />
        </CardContent>
      </Card>

      {/* Badge Tier Thresholds */}
      <Card
        className="bg-card border-border"
        data-ocid="layer1.badge_tiers_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2 text-base">
            Badge Tier Thresholds
            <span className="ml-auto text-xs font-normal text-muted-foreground border border-border rounded px-1.5 py-0.5">
              Read-only
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BadgeTierDisplay />
        </CardContent>
      </Card>

      {/* Tier Reset Settings */}
      <Card
        className="bg-card border-border"
        data-ocid="layer1.tier_reset_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2 text-base">
            <RefreshCw className="h-4 w-4" />
            Tier Reset Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TierResetSettings />
        </CardContent>
      </Card>
    </div>
  );
}
