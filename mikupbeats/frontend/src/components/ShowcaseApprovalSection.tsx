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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import {
  useApproveAllShowcases,
  useApproveShowcase,
  useDeleteShowcase,
  useGetPendingShowcases,
} from "../hooks/useQueries";

export default function ShowcaseApprovalSection() {
  const { data: pendingShowcases, isLoading } = useGetPendingShowcases();
  const approveShowcase = useApproveShowcase();
  const approveAll = useApproveAllShowcases();
  const deleteShowcase = useDeleteShowcase();
  const { play, pause, currentAudio, isPlaying } = useAudioPlayer();

  const handleApprove = async (id: string) => {
    try {
      await approveShowcase.mutateAsync(id);
      toast.success("Showcase approved!");
    } catch (error: any) {
      toast.error(error.message || "Failed to approve showcase");
    }
  };

  const handleApproveAll = async () => {
    try {
      await approveAll.mutateAsync();
      toast.success("All showcases approved!");
    } catch (error: any) {
      toast.error(error.message || "Failed to approve showcases");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteShowcase.mutateAsync(id);
      toast.success("Showcase deleted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete showcase");
    }
  };

  const handleAudioPlayPause = (audioUrl: string) => {
    if (currentAudio === audioUrl && isPlaying) {
      pause();
    } else {
      play(audioUrl);
    }
  };

  const formatCategory = (category: string) => {
    const categoryMap: Record<string, string> = {
      hipHop: "Hip Hop",
      pop: "Pop",
      rock: "Rock",
      electronic: "Electronic",
      lofi: "Lo-Fi",
    };
    return categoryMap[category] || category;
  };

  const formatStyle = (style: string) => {
    const styleMap: Record<string, string> = {
      oldSchool: "Old School",
      modern: "Modern",
      experimental: "Experimental",
      trap: "Trap",
      jazzInfluence: "Jazz Influence",
      classic: "Classic",
    };
    return styleMap[style] || style;
  };

  const formatTexture = (texture: string) => {
    const textureMap: Record<string, string> = {
      smooth: "Smooth",
      gritty: "Gritty",
      melodic: "Melodic",
      upbeat: "Upbeat",
    };
    return textureMap[texture] || texture;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/40">
      <CardHeader>
        <CardTitle>Showcase Approvals</CardTitle>
        <CardDescription>
          Review and approve showcase submissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingShowcases && pendingShowcases.length > 0 ? (
          <>
            <Button
              onClick={handleApproveAll}
              disabled={approveAll.isPending}
              className="w-full"
            >
              {approveAll.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving All...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve All Showcases ({pendingShowcases.length})
                </>
              )}
            </Button>

            <Accordion type="single" collapsible className="w-full">
              {pendingShowcases.map((showcase) => {
                const audioUrl = showcase.audioFile.getDirectURL();
                const coverUrl = showcase.coverArt?.getDirectURL();
                const isCurrentlyPlaying =
                  currentAudio === audioUrl && isPlaying;

                return (
                  <AccordionItem key={showcase.id} value={showcase.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        {coverUrl && (
                          <img
                            src={coverUrl}
                            alt={showcase.songName}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-semibold">
                            {showcase.songName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {showcase.artistName}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Category:
                            </span>
                            <div className="mt-1">
                              <Badge variant="outline">
                                {formatCategory(showcase.category)}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Style:
                            </span>
                            <div className="mt-1">
                              <Badge variant="outline">
                                {formatStyle(showcase.style)}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Texture:
                            </span>
                            <div className="mt-1">
                              <Badge variant="outline">
                                {formatTexture(showcase.texture)}
                              </Badge>
                            </div>
                          </div>
                          {showcase.beatId && (
                            <div>
                              <span className="text-muted-foreground">
                                Beat ID:
                              </span>
                              <div className="mt-1 font-mono text-xs">
                                {showcase.beatId}
                              </div>
                            </div>
                          )}
                        </div>

                        {showcase.externalLink && (
                          <div>
                            <span className="text-muted-foreground text-sm">
                              External Link:
                            </span>
                            <a
                              href={showcase.externalLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {showcase.externalLink}
                            </a>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAudioPlayPause(audioUrl)}
                            className="flex-1"
                          >
                            {isCurrentlyPlaying ? (
                              <>
                                <Pause className="mr-2 h-4 w-4" />
                                Pause Audio
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Play Audio
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(showcase.id)}
                            disabled={approveShowcase.isPending}
                            className="flex-1"
                          >
                            {approveShowcase.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Approving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </>
                            )}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Showcase
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "
                                  {showcase.songName}" by {showcase.artistName}?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(showcase.id)}
                                  disabled={deleteShowcase.isPending}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  {deleteShowcase.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    "Delete"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No pending showcases to review.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
