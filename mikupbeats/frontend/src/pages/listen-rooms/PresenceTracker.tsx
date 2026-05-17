import { useEffect, useRef } from "react";
import { useLeaveRoom, useRecordHeartbeat } from "../../hooks/useQueries";

const HEARTBEAT_INTERVAL_MS = 30_000;
const INTERACTION_INTERVAL_MS = 60_000;

interface PresenceTrackerProps {
  roomId: string;
  onInteractionRequired: () => void;
}

/**
 * PresenceTracker — invisible component.
 * Sends periodic heartbeats and triggers interaction checks.
 * Calls leaveRoom on unmount.
 */
export default function PresenceTracker({
  roomId,
  onInteractionRequired,
}: PresenceTrackerProps) {
  const recordHeartbeat = useRecordHeartbeat();
  const leaveRoom = useLeaveRoom();

  // Stable refs for mutate functions — avoids stale closure in intervals
  const recordMutateRef = useRef(recordHeartbeat.mutate);
  const leaveMutateRef = useRef(leaveRoom.mutate);
  const onInteractionRef = useRef(onInteractionRequired);
  recordMutateRef.current = recordHeartbeat.mutate;
  leaveMutateRef.current = leaveRoom.mutate;
  onInteractionRef.current = onInteractionRequired;

  // Track whether tab is visible
  const isVisibleRef = useRef(true);
  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;

  useEffect(() => {
    const handleVisibility = () => {
      isVisibleRef.current = document.visibilityState === "visible";
      if (!isVisibleRef.current) {
        recordMutateRef.current({
          roomId: roomIdRef.current,
          interactionCheckPassed: false,
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Heartbeat every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      recordMutateRef.current({
        roomId: roomIdRef.current,
        interactionCheckPassed: isVisibleRef.current,
      });
    }, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  // Interaction prompt every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (isVisibleRef.current) onInteractionRef.current();
    }, INTERACTION_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  // Leave room on unmount
  useEffect(() => {
    return () => {
      leaveMutateRef.current(roomIdRef.current);
    };
  }, []);

  return null;
}
