import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ExternalLink,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Mixtape } from "../backend";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDeleteMixtape,
  useIsCallerAdmin,
  useRecordMusicReward,
} from "../hooks/useQueries";
import { showMusicRewardToast } from "./MusicRewardToast";

interface MixtapeCardProps {
  mixtape: Mixtape;
}

export default function MixtapeCard({ mixtape }: MixtapeCardProps) {
  const { currentAudio, isPlaying, play, pause, audioRef } = useAudioPlayer();
  const { identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const deleteMixtape = useDeleteMixtape();
  const recordMusicReward = useRecordMusicReward();
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // Track which song indices have already been rewarded this session
  const rewardedTracksRef = useRef<Set<number>>(new Set());
  const albumRewardedRef = useRef(false);
  // Track whether cooldown toast was shown per-track this session
  const trackCooldownShownRef = useRef<Set<number>>(new Set());

  const isOwner =
    identity &&
    mixtape.uploader.toString() === identity.getPrincipal().toString();
  const canDelete = isAdmin || isOwner;
  const isLoggedIn = !!(identity && !identity.getPrincipal().isAnonymous());

  const currentSong = mixtape.songs[currentTrackIndex];
  const isCurrentlyPlaying =
    currentAudio === currentSong?.getDirectURL() && isPlaying;

  const attachEndedListener = (trackIndex: number) => {
    if (!audioRef.current) return;
    const handleEnded = async () => {
      audioRef.current?.removeEventListener("ended", handleEnded);
      if (!isLoggedIn) return;

      // Track completion reward
      if (!rewardedTracksRef.current.has(trackIndex)) {
        rewardedTracksRef.current.add(trackIndex);
        const songId = `${mixtape.id}:track${trackIndex}`;
        try {
          const tokens = await recordMusicReward.mutateAsync({
            contentType: "track",
            contentId: songId,
            rewardType: "completion",
          });
          const earned = Number(tokens);
          if (earned > 0) {
            showMusicRewardToast({ amount: earned, type: "earned" });
          } else if (!trackCooldownShownRef.current.has(trackIndex)) {
            // Show cooldown toast once per track index per session
            trackCooldownShownRef.current.add(trackIndex);
            showMusicRewardToast({
              amount: 0,
              type: "cooldown",
              contentLabel: "track",
            });
          } else {
            showMusicRewardToast({ amount: 0, type: "cap_reached" });
          }
        } catch {
          // silently ignore
        }
      }

      // Album completion reward — when last track finishes
      const isLastTrack = trackIndex === mixtape.songs.length - 1;
      if (isLastTrack && !albumRewardedRef.current) {
        albumRewardedRef.current = true;
        try {
          const tokens = await recordMusicReward.mutateAsync({
            contentType: "album",
            contentId: mixtape.id,
            rewardType: "album_completion",
          });
          if (Number(tokens) > 0) {
            showMusicRewardToast({ amount: Number(tokens), type: "earned" });
          }
          // No cap notice for album bonus — keep it clean
        } catch {
          // silently ignore
        }
      }
    };
    audioRef.current.addEventListener("ended", handleEnded);
  };

  const handlePlayPause = async () => {
    if (!currentSong) return;

    const url = currentSong.getDirectURL();
    if (isCurrentlyPlaying) {
      pause();
    } else {
      attachEndedListener(currentTrackIndex);
      play(url);
    }
  };

  const handleNext = () => {
    if (currentTrackIndex < mixtape.songs.length - 1) {
      const nextIndex = currentTrackIndex + 1;
      setCurrentTrackIndex(nextIndex);
      const nextSong = mixtape.songs[nextIndex];
      attachEndedListener(nextIndex);
      play(nextSong.getDirectURL());
    }
  };

  const handlePrevious = () => {
    if (currentTrackIndex > 0) {
      const prevIndex = currentTrackIndex - 1;
      setCurrentTrackIndex(prevIndex);
      const prevSong = mixtape.songs[prevIndex];
      attachEndedListener(prevIndex);
      play(prevSong.getDirectURL());
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMixtape.mutateAsync(mixtape.id);
      toast.success("Mixtape deleted successfully");
      setShowDeleteDialog(false);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete mixtape",
      );
    }
  };

  return (
    <>
      <Card className="bg-card/50 border-border/40 hover:border-[#a970ff]/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]">
        <CardHeader>
          {mixtape.coverArt && (
            <div className="relative w-full aspect-square mb-4 rounded-lg overflow-hidden">
              <img
                src={mixtape.coverArt.getDirectURL()}
                alt={mixtape.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardTitle className="text-[#a970ff]">{mixtape.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{mixtape.artistName}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{mixtape.description}</p>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              Track {currentTrackIndex + 1} of {mixtape.songs.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentTrackIndex === 0}
                className="border-border/40"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={handlePlayPause}
                className="flex-1 bg-[#a970ff] hover:bg-[#9860ef] text-white"
              >
                {isCurrentlyPlaying ? (
                  <Pause className="h-4 w-4 mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isCurrentlyPlaying ? "Pause" : "Play"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleNext}
                disabled={currentTrackIndex === mixtape.songs.length - 1}
                className="border-border/40"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {mixtape.externalLinks.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">External Links</p>
              {mixtape.externalLinks.map((link) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#a970ff] hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {link}
                </a>
              ))}
            </div>
          )}

          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Mixtape
            </Button>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-border/40">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mixtape</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{mixtape.title}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
