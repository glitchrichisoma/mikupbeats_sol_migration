import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Gift, Users, Zap } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  useClaimRoomReward,
  useGetActiveRooms,
  useGetRoomParticipants,
} from "../../hooks/useQueries";
import type { PoSPParticipantSession, PoSPRoom } from "../../types/posp";
import EmbeddedPlayer from "./EmbeddedPlayer";
import PresenceTracker from "./PresenceTracker";

function truncatePrincipal(p: string) {
  return p.length > 16 ? `${p.slice(0, 8)}…${p.slice(-5)}` : p;
}

interface ListenRoomProps {
  roomId: string;
  onBack: () => void;
}

export default function ListenRoom({ roomId, onBack }: ListenRoomProps) {
  const { identity } = useInternetIdentity();
  const [interactionPrompt, setInteractionPrompt] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [earnedTokens, setEarnedTokens] = useState<number | null>(null);

  const { data: activeRooms = [], isLoading: roomsLoading } =
    useGetActiveRooms();
  const { data: participants = [], isLoading: partLoading } =
    useGetRoomParticipants(roomId);
  const claimReward = useClaimRoomReward();

  const room: PoSPRoom | undefined = activeRooms.find(
    (r: PoSPRoom) => r.id === roomId,
  );

  const handleInteractionRequired = useCallback(
    () => setInteractionPrompt(true),
    [],
  );

  const handleClaim = async () => {
    try {
      const earned = await claimReward.mutateAsync(roomId);
      setEarnedTokens(earned);
      setRewardClaimed(true);
      toast.success(`Reward claimed: ${earned} MIK97!`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not claim reward",
      );
    }
  };

  if (roomsLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Room not found or has ended.</p>
        <Button variant="secondary" className="mt-4" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Rooms
        </Button>
      </div>
    );
  }

  const isCompleted = room.status === "Completed" || room.status === "Expired";
  const myPrincipal = identity?.getPrincipal().toText();
  const mySession = participants.find(
    (p: PoSPParticipantSession) => p.participantPrincipal === myPrincipal,
  );
  const avgScore =
    participants.length > 0
      ? Math.round(
          participants.reduce(
            (sum: number, p: PoSPParticipantSession) => sum + p.confidenceScore,
            0,
          ) / participants.length,
        )
      : 0;

  return (
    <div
      className="max-w-6xl mx-auto px-4 sm:px-6 py-6"
      data-ocid="listen-room.panel"
    >
      {/* PresenceTracker — invisible, runs in background */}
      {identity && !isCompleted && (
        <PresenceTracker
          roomId={roomId}
          onInteractionRequired={handleInteractionRequired}
        />
      )}

      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-5 transition-colors"
        data-ocid="listen-room.back_button"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Rooms
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Player */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-primary/40 text-primary font-mono text-xs"
            >
              {room.roomType === "SonicHash" ? (
                <>
                  <Zap className="h-3 w-3 mr-1" />
                  Sonic Hash
                </>
              ) : (
                "👁 Presence Tracking"
              )}
            </Badge>
            <h2 className="text-lg font-bold text-foreground">{room.title}</h2>
          </div>
          <EmbeddedPlayer
            contentUrl={room.contentUrl}
            contentType={room.roomType}
          />
        </div>

        {/* Right: Info panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Session confidence */}
          <div className="p-4 rounded-xl bg-secondary border border-border">
            <p className="text-xs text-muted-foreground mb-1">
              Group Confidence Score
            </p>
            <div className="text-3xl font-bold text-primary">{avgScore}%</div>
            {mySession && (
              <p className="text-xs text-muted-foreground mt-1">
                Your score: {mySession.confidenceScore}%
              </p>
            )}
          </div>

          {/* Participants */}
          <div className="p-4 rounded-xl bg-secondary border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Participants ({participants.length})
              </h3>
            </div>
            {partLoading ? (
              <div className="space-y-2">
                {[1, 2].map((n) => (
                  <Skeleton key={n} className="h-7 rounded" />
                ))}
              </div>
            ) : participants.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No participants yet
              </p>
            ) : (
              <ul className="space-y-2">
                {participants.map((p: PoSPParticipantSession, idx: number) => (
                  <li
                    key={p.participantPrincipal}
                    className="flex items-center justify-between text-xs"
                    data-ocid={`listen-room.participant.${idx + 1}`}
                  >
                    <span className="font-mono text-muted-foreground truncate max-w-[120px]">
                      {truncatePrincipal(p.participantPrincipal)}
                    </span>
                    <span
                      className={
                        p.confidenceScore >= 67
                          ? "text-primary"
                          : p.confidenceScore >= 34
                            ? "text-accent"
                            : "text-muted-foreground"
                      }
                    >
                      {p.confidenceScore}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Claim reward */}
          {isCompleted && identity && !rewardClaimed && (
            <Button
              className="w-full gap-2"
              onClick={handleClaim}
              disabled={claimReward.isPending}
              data-ocid="listen-room.claim_reward_button"
            >
              <Gift className="h-4 w-4" />
              {claimReward.isPending ? "Claiming…" : "Claim Reward"}
            </Button>
          )}
          {rewardClaimed && earnedTokens !== null && (
            <div
              className="flex items-center gap-2 justify-center p-3 rounded-xl bg-primary/15 border border-primary/30 text-primary font-bold"
              data-ocid="listen-room.reward_success_state"
            >
              <Gift className="h-4 w-4" />+{earnedTokens} MIK97 Claimed!
            </div>
          )}
        </div>
      </div>

      {/* Interaction check overlay */}
      {interactionPrompt && (
        <InteractionCheckOverlay
          roomId={roomId}
          onDismiss={() => setInteractionPrompt(false)}
        />
      )}
    </div>
  );
}

function InteractionCheckOverlay({
  roomId,
  onDismiss,
}: {
  roomId: string;
  onDismiss: () => void;
}) {
  const [countdown, setCountdown] = useState(10);
  const recordHeartbeat = useCallback(() => {}, []);
  void recordHeartbeat;
  void roomId;

  // Count down 10 seconds
  useState(() => {
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          onDismiss();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "oklch(0.08 0.01 270 / 0.85)" }}
      data-ocid="listen-room.interaction_check"
    >
      <div className="w-full max-w-sm rounded-xl border border-primary/30 bg-card p-6 text-center shadow-2xl">
        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-primary">{countdown}</span>
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">
          Still in the room?
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          Tap to confirm your presence and keep earning MIK97.
        </p>
        <Button
          className="w-full"
          onClick={onDismiss}
          data-ocid="listen-room.confirm_presence_button"
        >
          I'm here!
        </Button>
      </div>
    </div>
  );
}
