import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users } from "lucide-react";
import type { PoSPScheduledRoom } from "../../types/posp";

interface ScheduledRoomCardProps {
  room: PoSPScheduledRoom;
  dataOcid: string;
  CountdownTimer: React.FC<{ targetMs: number }>;
}

export default function ScheduledRoomCard({
  room,
  dataOcid,
  CountdownTimer,
}: ScheduledRoomCardProps) {
  const fiveMinBefore = room.scheduledAt - 5 * 60_000;
  const canJoin = Date.now() >= fiveMinBefore;

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-secondary hover:border-primary/30 transition-colors"
      data-ocid={dataOcid}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <Calendar className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-foreground truncate">{room.title}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Max {room.capacity}
            </span>
            <span>{room.durationMinutes}m session</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Starts in</p>
          <CountdownTimer targetMs={room.scheduledAt} />
        </div>
        {canJoin ? (
          <Button
            size="sm"
            className="gap-1.5"
            data-ocid={`${dataOcid}.join_button`}
          >
            Join Now
          </Button>
        ) : (
          <Badge variant="secondary" className="text-xs">
            Waiting
          </Badge>
        )}
      </div>
    </div>
  );
}
