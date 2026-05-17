import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCreatePresenceRoom } from "../../hooks/useQueries";
import type { PoSPConfig, PoSPRoomType } from "../../types/posp";

function detectRoomType(url: string): PoSPRoomType {
  if (!url.trim()) return "PresenceTracking";
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const externalHosts = [
      "youtube.com",
      "youtu.be",
      "soundcloud.com",
      "spotify.com",
      "open.spotify.com",
      "tidal.com",
      "music.apple.com",
    ];
    return externalHosts.some((h) => host === h || host.endsWith(`.${h}`))
      ? "PresenceTracking"
      : "SonicHash";
  } catch {
    return "PresenceTracking";
  }
}

const DURATION_OPTIONS = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
];

interface CreateRoomModalProps {
  config: PoSPConfig;
  onClose: () => void;
}

export default function CreateRoomModal({
  config,
  onClose,
}: CreateRoomModalProps) {
  const createRoom = useCreatePresenceRoom();
  const [title, setTitle] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [duration, setDuration] = useState(
    String(config.defaultRoomDurationMinutes ?? 60),
  );
  const [capacity, setCapacity] = useState(
    String(config.defaultRoomCapacity ?? 20),
  );

  const detectedType = detectRoomType(contentUrl);
  const isSonic = detectedType === "SonicHash";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a room title");
      return;
    }
    const cap = Math.min(
      Math.max(Number.parseInt(capacity, 10) || 20, 2),
      config.defaultRoomCapacity ?? 100,
    );
    try {
      await createRoom.mutateAsync({
        title: title.trim(),
        contentUrl: contentUrl.trim(),
        durationMinutes: Number.parseInt(duration, 10) || 60,
        capacity: cap,
      });
      toast.success("Room created successfully!");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create room");
    }
  };

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "oklch(0.08 0.01 270)" }}
      data-ocid="create-room.dialog"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-primary/30 bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2
              id="create-room-title"
              className="text-lg font-bold text-foreground"
            >
              Create Listen Room
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-ocid="create-room.close_button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="room-title">Room Title</Label>
            <Input
              id="room-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Friday Night Session"
              required
              data-ocid="create-room.title_input"
            />
          </div>

          {/* Content URL */}
          <div className="space-y-2">
            <Label htmlFor="content-url">Content URL</Label>
            <Input
              id="content-url"
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
              placeholder="Paste a YouTube, SoundCloud, Spotify or music link"
              data-ocid="create-room.content_url_input"
            />
            {contentUrl.trim() && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                Detected:{" "}
                <span className={isSonic ? "text-primary" : "text-accent"}>
                  {isSonic
                    ? "🔊 Sonic Hash (native)"
                    : "👁 Presence Tracking (external)"}
                </span>
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Leave blank for a general listening room.
            </p>
          </div>

          {/* Duration & Capacity row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger
                  id="duration"
                  data-ocid="create-room.duration_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Max Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min={2}
                max={config.defaultRoomCapacity ?? 100}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                data-ocid="create-room.capacity_input"
              />
            </div>
          </div>

          {/* Host fee notice */}
          {config.hostFeeEnabled && config.hostFeeAmount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-secondary border border-primary/20 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-primary shrink-0" />
              Creating this room costs{" "}
              <span className="text-primary font-bold">
                {config.hostFeeAmount} MIK97
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              data-ocid="create-room.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-2"
              disabled={createRoom.isPending}
              data-ocid="create-room.submit_button"
            >
              {createRoom.isPending ? "Creating…" : "Create Room"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
