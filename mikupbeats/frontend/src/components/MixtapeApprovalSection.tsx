import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Pause, Play, Star, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import {
  useApproveMixtape,
  useDeleteMixtape,
  useGetPendingMixtapes,
  useRejectMixtape,
  useSetShowcaseHighlight,
} from "../hooks/useQueries";

export default function MixtapeApprovalSection() {
  const { data: pendingMixtapes = [], isLoading } = useGetPendingMixtapes();
  const approveMixtape = useApproveMixtape();
  const rejectMixtape = useRejectMixtape();
  const deleteMixtape = useDeleteMixtape();
  const setShowcaseHighlight = useSetShowcaseHighlight();
  const { currentAudio, isPlaying, play, pause } = useAudioPlayer();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mixtapeToDelete, setMixtapeToDelete] = useState<string | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<Record<string, number>>(
    {},
  );

  const handleApprove = async (mixtapeId: string) => {
    try {
      const mixtape = pendingMixtapes.find((m) => m.id === mixtapeId);
      if (!mixtape) {
        toast.error("Mixtape not found");
        return;
      }

      // Get selected track index or default to first track
      const trackIndex = selectedTracks[mixtapeId] ?? 0;
      const selectedSong = mixtape.songs[trackIndex];

      if (!selectedSong) {
        toast.error("Selected track not found");
        return;
      }

      // Set showcase highlight first
      await setShowcaseHighlight.mutateAsync({
        mixtapeId: mixtape.id,
        song: selectedSong,
        artistName: mixtape.artistName,
      });

      // Then approve the mixtape
      await approveMixtape.mutateAsync(mixtapeId);

      toast.success("Mixtape approved and showcase highlight set!");

      // Clear selection
      setSelectedTracks((prev) => {
        const newState = { ...prev };
        delete newState[mixtapeId];
        return newState;
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to approve mixtape");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectMixtape.mutateAsync(id);
      toast.success("Mixtape rejected");

      // Clear selection
      setSelectedTracks((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to reject mixtape");
    }
  };

  const handleDelete = async () => {
    if (!mixtapeToDelete) return;
    try {
      await deleteMixtape.mutateAsync(mixtapeToDelete);
      toast.success("Mixtape deleted successfully");
      setDeleteDialogOpen(false);
      setMixtapeToDelete(null);

      // Clear selection
      setSelectedTracks((prev) => {
        const newState = { ...prev };
        delete newState[mixtapeToDelete];
        return newState;
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to delete mixtape");
    }
  };

  const handlePlayPause = async (url: string) => {
    if (currentAudio === url && isPlaying) {
      pause();
    } else {
      play(url);
    }
  };

  const handleTrackSelection = (mixtapeId: string, trackIndex: number) => {
    setSelectedTracks((prev) => ({
      ...prev,
      [mixtapeId]: trackIndex,
    }));
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/40">
        <CardHeader>
          <CardTitle className="text-[#a970ff]">
            Pending Mixtape Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card/50 border-border/40">
        <CardHeader>
          <CardTitle className="text-[#a970ff]">
            Pending Mixtape Approvals
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Select a featured track for each mixtape before approval. This track
            will appear on the Showcase page.
          </p>
        </CardHeader>
        <CardContent>
          {pendingMixtapes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No pending mixtapes to review
            </p>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {pendingMixtapes.map((mixtape) => {
                const selectedTrackIndex = selectedTracks[mixtape.id] ?? 0;
                return (
                  <AccordionItem
                    key={mixtape.id}
                    value={mixtape.id}
                    className="border border-border/40 rounded-lg px-4 bg-background/30"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-4 text-left">
                        {mixtape.coverArt && (
                          <img
                            src={mixtape.coverArt.getDirectURL()}
                            alt={mixtape.title}
                            className="w-16 h-16 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-semibold">{mixtape.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {mixtape.artistName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {mixtape.songs.length} tracks
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Description</p>
                        <p className="text-sm text-muted-foreground">
                          {mixtape.description}
                        </p>
                      </div>

                      <div className="p-4 border border-[#a970ff]/20 rounded-lg bg-card/50">
                        <div className="flex items-center gap-2 mb-3">
                          <Star className="h-4 w-4 text-[#a970ff]" />
                          <Label className="text-sm font-medium">
                            Select Featured Track for Showcase
                          </Label>
                        </div>
                        <Select
                          value={selectedTrackIndex.toString()}
                          onValueChange={(value) =>
                            handleTrackSelection(
                              mixtape.id,
                              Number.parseInt(value),
                            )
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose a track to feature" />
                          </SelectTrigger>
                          <SelectContent>
                            {mixtape.songs.map((_, index) => (
                              // biome-ignore lint/suspicious/noArrayIndexKey: track order is meaningful
                              <SelectItem key={index} value={index.toString()}>
                                Track {index + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-2">
                          This track will appear as a featured card on the
                          Showcase page, linking to the full mixtape.
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">
                          Tracks ({mixtape.songs.length})
                        </p>
                        <div className="space-y-2">
                          {mixtape.songs.map((song, index) => {
                            const songUrl = song.getDirectURL();
                            const isCurrentlyPlaying =
                              currentAudio === songUrl && isPlaying;
                            const isSelected = index === selectedTrackIndex;
                            return (
                              <div
                                key={songUrl}
                                className={`flex items-center justify-between bg-background/50 p-2 rounded ${
                                  isSelected
                                    ? "ring-2 ring-[#a970ff]/40 bg-[#a970ff]/5"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">
                                    Track {index + 1}
                                  </span>
                                  {isSelected && (
                                    <Badge className="bg-[#a970ff]/20 text-[#a970ff] text-xs">
                                      Featured
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handlePlayPause(songUrl)}
                                >
                                  {isCurrentlyPlaying ? (
                                    <Pause className="h-4 w-4" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {mixtape.externalLinks.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">
                            External Links
                          </p>
                          {mixtape.externalLinks.map((link) => (
                            <a
                              key={link}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm text-[#a970ff] hover:underline"
                            >
                              {link}
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={() => handleApprove(mixtape.id)}
                          disabled={
                            approveMixtape.isPending ||
                            setShowcaseHighlight.isPending
                          }
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve & Set Highlight
                        </Button>
                        <Button
                          onClick={() => handleReject(mixtape.id)}
                          disabled={rejectMixtape.isPending}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          onClick={() => {
                            setMixtapeToDelete(mixtape.id);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={deleteMixtape.isPending}
                          variant="outline"
                          className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border/40">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mixtape</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this mixtape? This action cannot
              be undone.
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
