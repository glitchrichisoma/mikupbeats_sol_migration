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
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Info,
  Radio,
  Settings2,
  Trash2,
  Users,
  Waves,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCancelScheduledRoom,
  useGetPoSPConfig,
  useGetScheduledRooms,
  useScheduleRoom,
  useSetPoSPConfig,
} from "../../hooks/useQueries";
import type { PoSPScheduledRoom } from "../../types/posp";

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
          <CheckCircle2 className="h-3.5 w-3.5" /> Saved
        </span>
      )}
      {status === "error" && (
        <span
          className="flex items-center gap-1 text-xs text-destructive font-medium"
          data-ocid={`${ocid}.error_state`}
        >
          <XCircle className="h-3.5 w-3.5" /> Error
        </span>
      )}
    </div>
  );
}

// ── Master Toggle ─────────────────────────────────────────────────────────────

function MasterToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors ${
        enabled ? "border-primary/40 bg-primary/5" : "border-border bg-muted/10"
      }`}
      data-ocid="layer2.master_toggle_row"
    >
      <div>
        <p
          className={`text-sm font-semibold ${enabled ? "text-foreground" : "text-muted-foreground"}`}
        >
          Layer 2 — PoSP Enabled
        </p>
        <p className="text-xs text-muted-foreground">
          {enabled
            ? "Listen rooms are live — users can host and join group sessions"
            : "Layer 2 is off — listen rooms are hidden from all users"}
        </p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={onChange}
        data-ocid="layer2.master_toggle"
      />
    </div>
  );
}

// ── Room Settings ─────────────────────────────────────────────────────────────

function RoomSettingsSection({
  capacity,
  setCapacity,
  duration,
  setDuration,
  minGroup,
  setMinGroup,
  consensus,
  setConsensus,
}: {
  capacity: string;
  setCapacity: (v: string) => void;
  duration: string;
  setDuration: (v: string) => void;
  minGroup: string;
  setMinGroup: (v: string) => void;
  consensus: string;
  setConsensus: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-primary" />
          Default Room Capacity
        </Label>
        <Input
          type="number"
          min={2}
          max={100}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          className="bg-background border-input"
          data-ocid="layer2.room.capacity_input"
        />
        <p className="text-xs text-muted-foreground">
          Max participants per room (2–100)
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-primary" />
          Default Room Duration (minutes)
        </Label>
        <Input
          type="number"
          min={10}
          max={180}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="bg-background border-input"
          data-ocid="layer2.room.duration_input"
        />
        <p className="text-xs text-muted-foreground">
          Room auto-closes after this many minutes (10–180)
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-primary" />
          Minimum Group Size for Verification
        </Label>
        <Input
          type="number"
          min={2}
          max={50}
          value={minGroup}
          onChange={(e) => setMinGroup(e.target.value)}
          className="bg-background border-input"
          data-ocid="layer2.room.min_group_input"
        />
        <p className="text-xs text-muted-foreground">
          Minimum participants needed for group verification (2+)
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Waves className="h-3.5 w-3.5 text-primary" />
          Consensus Window (minutes)
        </Label>
        <Input
          type="number"
          min={1}
          max={10}
          value={consensus}
          onChange={(e) => setConsensus(e.target.value)}
          className="bg-background border-input"
          data-ocid="layer2.room.consensus_window_input"
        />
        <p className="text-xs text-muted-foreground">
          Time window for fingerprint/presence matching (1–10 min)
        </p>
      </div>
    </div>
  );
}

// ── Reward Rates Section ──────────────────────────────────────────────────────

function RewardRatesSection({
  nativeRate,
  setNativeRate,
  externalRate,
  setExternalRate,
  minActiveTime,
  setMinActiveTime,
}: {
  nativeRate: string;
  setNativeRate: (v: string) => void;
  externalRate: string;
  setExternalRate: (v: string) => void;
  minActiveTime: string;
  setMinActiveTime: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5 text-primary" />
            Native Content Rate (MIK97 / min)
          </Label>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={nativeRate}
            onChange={(e) => setNativeRate(e.target.value)}
            className="bg-background border-input"
            data-ocid="layer2.rewards.native_rate_input"
          />
          <p className="text-xs text-muted-foreground">
            For sonic hash verified rooms (MikupBeats-hosted content)
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5 text-muted-foreground" />
            External Link Rate (MIK97 / min)
          </Label>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={externalRate}
            onChange={(e) => setExternalRate(e.target.value)}
            className="bg-background border-input"
            data-ocid="layer2.rewards.external_rate_input"
          />
          <p className="text-xs text-muted-foreground">
            For presence-tracking rooms (YouTube, Spotify, SoundCloud)
          </p>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">
            Minimum Active Time Required (%)
          </Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={minActiveTime}
            onChange={(e) => setMinActiveTime(e.target.value)}
            className="bg-background border-input max-w-[160px]"
            data-ocid="layer2.rewards.min_active_time_input"
          />
          <p className="text-xs text-muted-foreground">
            User must be actively present for at least this % of the session
            duration to earn any reward
          </p>
        </div>
      </div>

      <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground flex items-start gap-2">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
        <span>
          Rewards are split automatically based on how many participants
          complete the session. Native content (sonic hash) pays more than
          external links (presence tracking).
        </span>
      </div>
    </div>
  );
}

// ── Host Fee Section ──────────────────────────────────────────────────────────

function HostFeeSection({
  feeEnabled,
  setFeeEnabled,
  feeAmount,
  setFeeAmount,
}: {
  feeEnabled: boolean;
  setFeeEnabled: (v: boolean) => void;
  feeAmount: string;
  setFeeAmount: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 border border-border px-3 py-2.5">
        <div>
          <p className="text-sm font-medium text-foreground">
            Host Fee Enabled
          </p>
          <p className="text-xs text-muted-foreground">
            {feeEnabled
              ? "Hosts pay MIK97 to create a presence room"
              : "Currently free — recommended while platform is growing"}
          </p>
        </div>
        <Switch
          checked={feeEnabled}
          onCheckedChange={setFeeEnabled}
          data-ocid="layer2.host_fee.enabled_toggle"
        />
      </div>

      {feeEnabled && (
        <div className="space-y-1.5 pl-1">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5 text-primary" />
            Host Fee Amount (MIK97)
          </Label>
          <Input
            type="number"
            min={0}
            step={1}
            value={feeAmount}
            onChange={(e) => setFeeAmount(e.target.value)}
            className="bg-background border-input max-w-[160px]"
            data-ocid="layer2.host_fee.amount_input"
          />
        </div>
      )}

      <div className="rounded-md bg-muted/20 border border-border px-3 py-2 text-xs text-muted-foreground flex items-start gap-2">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>
          Host fee applies only to external link rooms. Native content rooms
          (MikupBeats-hosted) are always free to host.
        </span>
      </div>
    </div>
  );
}

// ── Auto-Rooms Section ────────────────────────────────────────────────────────

function AutoRoomsSection({
  autoEnabled,
  setAutoEnabled,
  playCount,
  setPlayCount,
  maxPerDay,
  setMaxPerDay,
}: {
  autoEnabled: boolean;
  setAutoEnabled: (v: boolean) => void;
  playCount: string;
  setPlayCount: (v: string) => void;
  maxPerDay: string;
  setMaxPerDay: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 border border-border px-3 py-2.5">
        <div>
          <p className="text-sm font-medium text-foreground">
            Auto-Room Enabled
          </p>
          <p className="text-xs text-muted-foreground">
            {autoEnabled
              ? "Platform auto-creates sonic hash rooms when native content reaches the play count threshold"
              : "Off — rooms are only created manually by hosts"}
          </p>
        </div>
        <Switch
          checked={autoEnabled}
          onCheckedChange={setAutoEnabled}
          data-ocid="layer2.auto_room.enabled_toggle"
        />
      </div>

      {autoEnabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-1">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Play Count Threshold
            </Label>
            <Input
              type="number"
              min={1}
              value={playCount}
              onChange={(e) => setPlayCount(e.target.value)}
              className="bg-background border-input"
              data-ocid="layer2.auto_room.play_count_input"
            />
            <p className="text-xs text-muted-foreground">
              Plays a track needs before auto-room triggers
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Max Scheduled Rooms Per Day
            </Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={maxPerDay}
              onChange={(e) => setMaxPerDay(e.target.value)}
              className="bg-background border-input"
              data-ocid="layer2.auto_room.max_per_day_input"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Scheduled Rooms Section ───────────────────────────────────────────────────

function ScheduledRoomsSection() {
  const { data: scheduledRooms = [] } = useGetScheduledRooms();
  const scheduleRoom = useScheduleRoom();
  const cancelRoom = useCancelScheduledRoom();

  const [title, setTitle] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [contentType, setContentType] = useState<"Native" | "External">(
    "External",
  );
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMin, setDurationMin] = useState("60");
  const [capacityInput, setCapacityInput] = useState("20");
  const [scheduleStatus, setScheduleStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const handleSchedule = () => {
    if (!title.trim() || !contentUrl.trim() || !scheduledAt) {
      toast.error("Title, URL, and scheduled date/time are required.");
      return;
    }
    setScheduleStatus("saving");
    scheduleRoom.mutate(
      {
        title: title.trim(),
        contentUrl: contentUrl.trim(),
        contentType,
        scheduledAt: new Date(scheduledAt).getTime(),
        durationMinutes: Math.max(10, Number(durationMin) || 60),
        capacity: Math.max(2, Number(capacityInput) || 20),
      },
      {
        onSuccess: () => {
          setScheduleStatus("saved");
          toast.success("Room scheduled.");
          setTitle("");
          setContentUrl("");
          setScheduledAt("");
          setTimeout(() => setScheduleStatus("idle"), 3000);
        },
        onError: (err: Error) => {
          setScheduleStatus("error");
          toast.error(err.message || "Failed to schedule room.");
          setTimeout(() => setScheduleStatus("idle"), 3000);
        },
      },
    );
  };

  const handleCancel = (roomId: string) => {
    cancelRoom.mutate(roomId, {
      onSuccess: () => toast.success("Room cancelled."),
      onError: (err: Error) => toast.error(err.message || "Failed to cancel."),
    });
  };

  return (
    <div className="space-y-5">
      {/* Schedule Form */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Create Scheduled Room
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Room Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Friday Night Listen Session"
              className="bg-background border-input"
              data-ocid="layer2.schedule.title_input"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Content URL</Label>
            <Input
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
              placeholder="https://youtu.be/... or native content ID"
              className="bg-background border-input"
              data-ocid="layer2.schedule.url_input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Content Type
            </Label>
            <Select
              value={contentType}
              onValueChange={(v) => setContentType(v as "Native" | "External")}
            >
              <SelectTrigger
                className="bg-background border-input"
                data-ocid="layer2.schedule.content_type_select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="External">
                  External (YouTube, Spotify, etc.)
                </SelectItem>
                <SelectItem value="Native">
                  Native (MikupBeats-hosted)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Scheduled Date &amp; Time
            </Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="bg-background border-input"
              data-ocid="layer2.schedule.datetime_input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Duration (minutes)
            </Label>
            <Input
              type="number"
              min={10}
              max={180}
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              className="bg-background border-input"
              data-ocid="layer2.schedule.duration_input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Capacity</Label>
            <Input
              type="number"
              min={2}
              max={100}
              value={capacityInput}
              onChange={(e) => setCapacityInput(e.target.value)}
              className="bg-background border-input"
              data-ocid="layer2.schedule.capacity_input"
            />
          </div>
        </div>
        <SaveButton
          status={scheduleStatus}
          onClick={handleSchedule}
          ocid="layer2.schedule.submit_button"
          label="Schedule Room"
        />
      </div>

      {/* Upcoming Rooms List */}
      {scheduledRooms.length > 0 && (
        <div className="space-y-2" data-ocid="layer2.schedule.list">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Upcoming Scheduled Rooms
          </p>
          {scheduledRooms.map((room: PoSPScheduledRoom, idx: number) => (
            <div
              key={room.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/10 px-3 py-2.5"
              data-ocid={`layer2.schedule.item.${idx + 1}`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {room.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(room.scheduledAt).toLocaleString()} ·{" "}
                  {room.durationMinutes} min ·{" "}
                  <span
                    className={
                      room.contentType === "Native"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                  >
                    {room.contentType}
                  </span>
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive shrink-0"
                onClick={() => handleCancel(room.id)}
                data-ocid={`layer2.schedule.cancel_button.${idx + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {scheduledRooms.length === 0 && (
        <div
          className="text-center py-6 text-muted-foreground text-xs"
          data-ocid="layer2.schedule.empty_state"
        >
          No scheduled rooms yet. Use the form above to create one.
        </div>
      )}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function Layer2SettingsPanel() {
  const { data: config, isLoading } = useGetPoSPConfig();
  const setConfig = useSetPoSPConfig();

  const [layer2Enabled, setLayer2Enabled] = useState(false);
  const [capacity, setCapacity] = useState("20");
  const [duration, setDuration] = useState("60");
  const [minGroup, setMinGroup] = useState("2");
  const [consensus, setConsensus] = useState("3");
  const [nativeRate, setNativeRate] = useState("0.5");
  const [externalRate, setExternalRate] = useState("0.2");
  const [minActiveTime, setMinActiveTime] = useState("80");
  const [hostFeeEnabled, setHostFeeEnabled] = useState(false);
  const [hostFeeAmount, setHostFeeAmount] = useState("10");
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [playCount, setPlayCount] = useState("50");
  const [maxPerDay, setMaxPerDay] = useState("5");
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  // Sync from backend/localStorage when config loads
  useState(() => {
    if (config) {
      setLayer2Enabled(config.layer2Enabled);
      setCapacity(String(config.defaultRoomCapacity));
      setDuration(String(config.defaultRoomDurationMinutes));
      setMinGroup(String(config.minGroupSize));
      setConsensus(String(config.consensusWindowMinutes));
      setNativeRate(String(config.nativeRewardRatePerMinute));
      setExternalRate(String(config.externalRewardRatePerMinute));
      setMinActiveTime(String(config.minActiveTimePercent));
      setHostFeeEnabled(config.hostFeeEnabled);
      setHostFeeAmount(String(config.hostFeeAmount));
      setAutoEnabled(config.autoRoomEnabled);
      setPlayCount(String(config.autoRoomPlayCountThreshold));
      setMaxPerDay(String(config.maxScheduledRoomsPerDay));
    }
  });

  const handleSaveAll = () => {
    setSaveStatus("saving");
    setConfig.mutate(
      {
        layer2Enabled,
        defaultRoomCapacity: Math.max(2, Number(capacity) || 20),
        defaultRoomDurationMinutes: Math.max(10, Number(duration) || 60),
        minGroupSize: Math.max(2, Number(minGroup) || 2),
        consensusWindowMinutes: Math.max(
          1,
          Math.min(10, Number(consensus) || 3),
        ),
        nativeRewardRatePerMinute: Math.max(0, Number(nativeRate) || 0.5),
        externalRewardRatePerMinute: Math.max(0, Number(externalRate) || 0.2),
        minActiveTimePercent: Math.max(
          0,
          Math.min(100, Number(minActiveTime) || 80),
        ),
        hostFeeEnabled,
        hostFeeAmount: Math.max(0, Number(hostFeeAmount) || 0),
        autoRoomEnabled: autoEnabled,
        autoRoomPlayCountThreshold: Math.max(1, Number(playCount) || 50),
        maxScheduledRoomsPerDay: Math.max(1, Number(maxPerDay) || 5),
      },
      {
        onSuccess: () => {
          setSaveStatus("saved");
          toast.success("Layer 2 settings saved.");
          setTimeout(() => setSaveStatus("idle"), 3000);
        },
        onError: (err: Error) => {
          setSaveStatus("error");
          toast.error(err.message || "Failed to save Layer 2 settings.");
          setTimeout(() => setSaveStatus("idle"), 3000);
        },
      },
    );
  };

  if (isLoading)
    return <div className="animate-pulse h-48 rounded bg-muted/30" />;

  return (
    <div className="space-y-6" data-ocid="layer2.panel">
      {/* Status Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3">
        <Radio className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              Layer 2 — Proof of Sonic Presence
            </p>
            <Badge
              variant="outline"
              className="text-yellow-500 border-yellow-500/40 text-[10px]"
            >
              Coming Soon
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure listen rooms, verification windows, reward rates, and host
            controls. These settings will take effect once the PoSP backend is
            deployed.
          </p>
        </div>
      </div>

      {/* Master Toggle */}
      <MasterToggle enabled={layer2Enabled} onChange={setLayer2Enabled} />

      {/* Room Settings */}
      <Card
        className="bg-card border-border"
        data-ocid="layer2.room_settings_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4" />
            Room Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RoomSettingsSection
            capacity={capacity}
            setCapacity={setCapacity}
            duration={duration}
            setDuration={setDuration}
            minGroup={minGroup}
            setMinGroup={setMinGroup}
            consensus={consensus}
            setConsensus={setConsensus}
          />
        </CardContent>
      </Card>

      {/* Reward Rates */}
      <Card
        className="bg-card border-border"
        data-ocid="layer2.reward_rates_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2 text-base">
            <Coins className="h-4 w-4" />
            Reward Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RewardRatesSection
            nativeRate={nativeRate}
            setNativeRate={setNativeRate}
            externalRate={externalRate}
            setExternalRate={setExternalRate}
            minActiveTime={minActiveTime}
            setMinActiveTime={setMinActiveTime}
          />
        </CardContent>
      </Card>

      {/* Host Fee */}
      <Card className="bg-card border-border" data-ocid="layer2.host_fee_card">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" />
            Host Fee Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HostFeeSection
            feeEnabled={hostFeeEnabled}
            setFeeEnabled={setHostFeeEnabled}
            feeAmount={hostFeeAmount}
            setFeeAmount={setHostFeeAmount}
          />
        </CardContent>
      </Card>

      {/* Auto-Rooms */}
      <Card
        className="bg-card border-border"
        data-ocid="layer2.auto_rooms_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2 text-base">
            <Bot className="h-4 w-4" />
            Auto-Rooms (Native Content)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AutoRoomsSection
            autoEnabled={autoEnabled}
            setAutoEnabled={setAutoEnabled}
            playCount={playCount}
            setPlayCount={setPlayCount}
            maxPerDay={maxPerDay}
            setMaxPerDay={setMaxPerDay}
          />
        </CardContent>
      </Card>

      {/* Scheduled Rooms */}
      <Card
        className="bg-card border-border"
        data-ocid="layer2.scheduled_rooms_card"
      >
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Scheduled Rooms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScheduledRoomsSection />
        </CardContent>
      </Card>

      {/* Global Save */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Save all Layer 2 settings above
        </p>
        <SaveButton
          status={saveStatus}
          onClick={handleSaveAll}
          ocid="layer2.save_all_button"
          label="Save All Layer 2 Settings"
        />
      </div>
    </div>
  );
}
