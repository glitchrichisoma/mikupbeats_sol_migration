import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Wifi, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import type { PoSPRoom, PoSPRoomStatus } from "../../types/posp";

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "Expired";
  const mins = Math.floor(ms / 60_000);
  const secs = Math.floor((ms % 60_000) / 1000);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  }
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

function truncatePrincipal(principal: string): string {
  if (principal.length <= 16) return principal;
  return `${principal.slice(0, 8)}…${principal.slice(-5)}`;
}

function StatusDot({ status }: { status: PoSPRoomStatus }) {
  if (status === "Active") {
    return (
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
      </span>
    );
  }
  if (status === "Waiting") {
    return <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />;
  }
  if (status === "Completed") {
    return <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />;
  }
  return <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />;
}

function ContentTypeBadge({ roomType }: { roomType: PoSPRoom["roomType"] }) {
  if (roomType === "SonicHash") {
    return (
      <Badge
        variant="outline"
        className="border-primary/40 text-primary text-xs font-mono"
      >
        <Zap className="h-3 w-3 mr-1" />
        Sonic Hash
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-accent/40 text-accent text-xs font-mono"
    >
      <Wifi className="h-3 w-3 mr-1" />
      Presence
    </Badge>
  );
}

interface RoomCardProps {
  room: PoSPRoom;
  dataOcid: string;
  onJoin: () => void;
}

export default function RoomCard({ room, dataOcid, onJoin }: RoomCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!room.startedAt) return;
    const expiresAt = room.startedAt + room.durationMinutes * 60_000;
    const tick = () => setTimeRemaining(expiresAt - Date.now());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [room.startedAt, room.durationMinutes]);

  const isFull = room.currentParticipants >= room.capacity;
  const isCompleted = room.status === "Completed" || room.status === "Expired";
  const disableJoin = isFull || isCompleted;

  const isActive = room.status === "Active";

  return (
    <div
      className={[
        "relative flex flex-col rounded-xl border bg-secondary transition-all duration-200 hover:border-primary/50",
        isActive
          ? "border-primary/40 shadow-[0_0_15px_rgba(0,0,0,0.3)] shadow-primary/10"
          : "border-border",
      ].join(" ")}
      data-ocid={dataOcid}
    >
      {/* Top accent bar */}
      <div
        className={`h-1 rounded-t-xl ${isActive ? "bg-primary" : "bg-border"}`}
      />

      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Status row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusDot status={room.status} />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {room.status}
            </span>
          </div>
          <ContentTypeBadge roomType={room.roomType} />
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-foreground line-clamp-2 leading-snug">
          {room.title}
        </h3>

        {/* Host */}
        <p className="text-xs text-muted-foreground font-mono">
          Host: {truncatePrincipal(room.hostPrincipal)}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {room.currentParticipants}/{room.capacity}
          </span>
          {timeRemaining !== null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {timeRemaining <= 0
                ? "Expired"
                : formatTimeRemaining(timeRemaining)}
            </span>
          )}
          {room.status === "Waiting" && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {room.durationMinutes}m session
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <Button
          size="sm"
          className="w-full gap-2"
          disabled={disableJoin}
          onClick={onJoin}
          data-ocid={`${dataOcid}.join_button`}
        >
          {isCompleted ? "Completed" : isFull ? "Room Full" : "Join Room"}
        </Button>
      </div>
    </div>
  );
}
