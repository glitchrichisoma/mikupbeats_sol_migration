import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { Activity, Headphones, Plus, Radio, Wifi, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetActiveRooms,
  useGetMyRoomSessions,
  useGetPoSPConfig,
  useGetPoSPStats,
  useGetScheduledRooms,
} from "../hooks/useQueries";
import type { PoSPRoom, PoSPScheduledRoom } from "../types/posp";
import CreateRoomModal from "./listen-rooms/CreateRoomModal";
import RoomCard from "./listen-rooms/RoomCard";
import ScheduledRoomCard from "./listen-rooms/ScheduledRoomCard";

function ResonanceHeroBg() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Waveform bars — CSS-only decorative */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-[3px] h-24 px-6 opacity-10">
        {Array.from({ length: 60 }, (_, i) => i).map((i) => (
          <div
            key={i}
            className="w-[3px] rounded-t-sm bg-primary"
            style={{
              height: `${20 + Math.sin(i * 0.4) * 30 + Math.cos(i * 0.7) * 20}%`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute top-0 right-1/4 w-64 h-64 rounded-full bg-accent/5 blur-3xl" />
    </div>
  );
}

function StatItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.FC<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-secondary/80 rounded-lg border border-primary/20">
      <Icon className="h-4 w-4 text-primary shrink-0" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-bold text-foreground">{value}</div>
      </div>
    </div>
  );
}

function CountdownTimer({ targetMs }: { targetMs: number }) {
  const [remaining, setRemaining] = useState(targetMs - Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = targetMs - Date.now();
      setRemaining(diff);
      if (diff <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [targetMs]);

  if (remaining <= 0)
    return <span className="text-primary font-bold">Starting now</span>;

  const hrs = Math.floor(remaining / 3_600_000);
  const mins = Math.floor((remaining % 3_600_000) / 60_000);
  const secs = Math.floor((remaining % 60_000) / 1000);

  return (
    <span className="font-mono text-sm text-muted-foreground">
      {hrs > 0 && `${hrs}h `}
      {String(mins).padStart(2, "0")}m {String(secs).padStart(2, "0")}s
    </span>
  );
}

export default function ListenRoomsPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: config, isLoading: configLoading } = useGetPoSPConfig();
  const { data: activeRooms = [], isLoading: roomsLoading } =
    useGetActiveRooms();
  const { data: scheduledRooms = [] } = useGetScheduledRooms();
  const { data: stats } = useGetPoSPStats();
  const { data: mySessions = [] } = useGetMyRoomSessions();

  const isAuthenticated = !!identity;
  const layer2Enabled = config?.layer2Enabled ?? false;

  // Only upcoming scheduled rooms
  const upcoming = scheduledRooms.filter(
    (r: PoSPScheduledRoom) =>
      r.status === "Scheduled" && r.scheduledAt > Date.now(),
  );

  return (
    <div className="min-h-screen bg-background" data-ocid="listen-rooms.page">
      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div className="relative bg-secondary border-b border-primary/30 overflow-hidden">
        <ResonanceHeroBg />
        <div className="relative z-10 px-4 sm:px-8 py-10 max-w-6xl mx-auto">
          {/* Protocol badge */}
          <div className="flex items-center gap-2 mb-3">
            <Badge
              variant="outline"
              className="border-primary/50 text-primary text-xs font-mono uppercase tracking-widest px-3 py-1"
            >
              <Zap className="h-3 w-3 mr-1" />
              Layer 2 — Resonance Protocol
            </Badge>
            {layer2Enabled ? (
              <Badge className="bg-primary/20 text-primary border border-primary/40 text-xs">
                <span className="inline-block h-2 w-2 rounded-full bg-primary mr-1 animate-pulse" />
                Live
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Coming Soon
              </Badge>
            )}
          </div>

          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-3">
                <Radio className="h-8 w-8 text-primary" />
                Listen Rooms
              </h1>
              <p className="mt-1 text-muted-foreground text-base">
                Verify your presence. Earn MIK97.
              </p>
            </div>

            {isAuthenticated && layer2Enabled && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="shrink-0 gap-2 bg-primary hover:bg-primary/90"
                data-ocid="listen-rooms.create_room_button"
              >
                <Plus className="h-4 w-4" />
                Create Room
              </Button>
            )}
          </div>

          {/* Stats bar */}
          {!configLoading && (
            <div className="mt-6 flex flex-wrap gap-3">
              <StatItem
                label="Total Rooms"
                value={stats?.totalRooms ?? 0}
                icon={Headphones}
              />
              <StatItem
                label="Active Now"
                value={
                  activeRooms.filter((r: PoSPRoom) => r.status === "Active")
                    .length
                }
                icon={Activity}
              />
              <StatItem
                label="Your Sessions"
                value={mySessions.length}
                icon={Wifi}
              />
              <StatItem
                label="Verified Sessions"
                value={stats?.totalVerifiedSessions ?? 0}
                icon={Zap}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Page body ─────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-10">
        {/* Layer 2 disabled state */}
        {!layer2Enabled && !configLoading && (
          <div
            className="flex flex-col items-center justify-center py-20 text-center"
            data-ocid="listen-rooms.coming_soon"
          >
            <div className="h-20 w-20 rounded-full bg-secondary border-2 border-primary/30 flex items-center justify-center mb-6">
              <Radio className="h-10 w-10 text-primary/60" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Layer 2 Coming Soon
            </h2>
            <p className="text-muted-foreground max-w-md">
              Proof of Sonic Presence is being activated. When it goes live,
              you'll be able to join synchronized listen rooms and earn MIK97
              for verified group listening.
            </p>
          </div>
        )}

        {/* Active Rooms section */}
        {(layer2Enabled || configLoading) && (
          <section data-ocid="listen-rooms.active_rooms_section">
            <SectionHeader icon={Activity} label="Active Rooms" pulse />

            {roomsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} className="h-52 rounded-xl" />
                ))}
              </div>
            ) : activeRooms.length === 0 ? (
              <div
                className="mt-4 flex flex-col items-center justify-center py-14 rounded-xl border border-dashed border-primary/20 bg-secondary/30 text-center"
                data-ocid="listen-rooms.active_rooms_empty_state"
              >
                <Radio className="h-12 w-12 text-primary/40 mb-3" />
                <p className="text-muted-foreground font-medium">
                  No active rooms right now.
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Create one to start a verified listening session.
                </p>
                {isAuthenticated && (
                  <Button
                    size="sm"
                    className="mt-4 gap-2"
                    onClick={() => setShowCreateModal(true)}
                    data-ocid="listen-rooms.create_first_room_button"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create Room
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {activeRooms.map((room: PoSPRoom, idx: number) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    dataOcid={`listen-rooms.room_card.${idx + 1}`}
                    onJoin={() =>
                      navigate({ to: `/listen-rooms/${room.id}` as any })
                    }
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Scheduled Rooms */}
        {layer2Enabled && upcoming.length > 0 && (
          <section data-ocid="listen-rooms.scheduled_section">
            <SectionHeader icon={Headphones} label="Upcoming Sessions" />
            <div className="mt-4 space-y-3">
              {upcoming.map((room: PoSPScheduledRoom, idx: number) => (
                <ScheduledRoomCard
                  key={room.id}
                  room={room}
                  dataOcid={`listen-rooms.scheduled_room.${idx + 1}`}
                  CountdownTimer={CountdownTimer}
                />
              ))}
            </div>
          </section>
        )}

        {/* Your Sessions */}
        {isAuthenticated && mySessions.length > 0 && (
          <section data-ocid="listen-rooms.my_sessions_section">
            <SectionHeader icon={Zap} label="Your Session History" />
            <div className="mt-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/80">
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                      Room
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                      Date
                    </th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                      Score
                    </th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                      Earned
                    </th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mySessions.map((session, idx) => (
                    <tr
                      key={`${session.roomId}-${idx}`}
                      className="border-b border-border/50 hover:bg-secondary/40 transition-colors"
                      data-ocid={`listen-rooms.session_row.${idx + 1}`}
                    >
                      <td className="px-4 py-3 font-medium text-foreground max-w-[120px] truncate">
                        {session.roomId}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(session.joinedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {session.confidenceScore}%
                      </td>
                      <td className="px-4 py-3 text-right text-primary font-mono">
                        +{session.tokensEarned} MIK97
                      </td>
                      <td className="px-4 py-3 text-right">
                        <SessionStatusBadge
                          passed={session.passed}
                          score={session.confidenceScore}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <CreateRoomModal
          config={config!}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  label,
  pulse = false,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  pulse?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 pb-2 border-b border-primary/20">
      <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h2 className="text-lg font-bold text-foreground tracking-tight">
        {label}
      </h2>
      {pulse && (
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
      )}
      {/* waveform accent line */}
      <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
    </div>
  );
}

function SessionStatusBadge({
  passed,
  score,
}: { passed: boolean; score: number }) {
  if (passed) {
    return (
      <Badge className="bg-emerald-900/40 text-emerald-400 border border-emerald-700/40 text-xs">
        Verified
      </Badge>
    );
  }
  if (score > 0) {
    return (
      <Badge variant="secondary" className="text-xs">
        Pending
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground text-xs">
      Unverified
    </Badge>
  );
}
