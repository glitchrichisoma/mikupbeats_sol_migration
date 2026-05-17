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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Edit, ExternalLink, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type Beat,
  DeliveryMethod,
  type RightsFolder,
  RightsType,
} from "../backend";
import {
  useDeleteBeat,
  useGetBeats,
  useUnmarkRightsAsSold,
} from "../hooks/useQueries";
import EditBeatDialog from "./EditBeatDialog";

export default function BeatManagementSection() {
  const { data: beats, isLoading } = useGetBeats();
  const deleteBeat = useDeleteBeat();
  const unmarkRightsAsSold = useUnmarkRightsAsSold();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [beatToDelete, setBeatToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [beatToEdit, setBeatToEdit] = useState<Beat | null>(null);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [rightsToReopen, setRightsToReopen] = useState<{
    beatId: string;
    beatTitle: string;
    rightsType: RightsType;
    rightsLabel: string;
  } | null>(null);

  const handleDeleteClick = (id: string, title: string) => {
    setBeatToDelete({ id, title });
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (beat: Beat) => {
    setBeatToEdit(beat);
    setEditDialogOpen(true);
  };

  const handleReopenClick = (
    beatId: string,
    beatTitle: string,
    folder: RightsFolder,
  ) => {
    setRightsToReopen({
      beatId,
      beatTitle,
      rightsType: folder.rightsType,
      rightsLabel: getRightsLabel(folder.rightsType),
    });
    setReopenDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!beatToDelete) return;

    try {
      await deleteBeat.mutateAsync(beatToDelete.id);
      toast.success(`Beat "${beatToDelete.title}" deleted successfully`);
      setDeleteDialogOpen(false);
      setBeatToDelete(null);
    } catch (error) {
      console.error("Error deleting beat:", error);
      toast.error("Failed to delete beat. Please try again.");
    }
  };

  const handleConfirmReopen = async () => {
    if (!rightsToReopen) return;

    try {
      await unmarkRightsAsSold.mutateAsync({
        beatId: rightsToReopen.beatId,
        rightsType: rightsToReopen.rightsType,
      });
      toast.success(
        `${rightsToReopen.rightsLabel} for "${rightsToReopen.beatTitle}" reopened for sale`,
      );
      setReopenDialogOpen(false);
      setRightsToReopen(null);
    } catch (error) {
      console.error("Error reopening rights:", error);
      toast.error("Failed to reopen rights. Please try again.");
    }
  };

  const getRightsLabel = (rightsType: RightsType) => {
    switch (rightsType) {
      case RightsType.basicRight:
        return "Basic Right";
      case RightsType.premiumRight:
        return "Premium Right";
      case RightsType.exclusiveRight:
        return "Exclusive Right";
      case RightsType.stems:
        return "Stems";
      default:
        return "Unknown Right";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card className="bg-card/50 backdrop-blur-sm border-border/40">
        <CardHeader>
          <CardTitle>Beat Management</CardTitle>
          <CardDescription>
            View, edit, and manage all uploaded beats with delivery method
            details and rights status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!beats || beats.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No beats uploaded yet
            </p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {beats.map((beat) => (
                <AccordionItem key={beat.id} value={beat.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{beat.title}</span>
                        <Badge variant="outline" className="border-primary/20">
                          {beat.rightsFolders.length} Rights
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="border-blue-500/20 bg-blue-500/10 text-blue-500"
                        >
                          {beat.deliveryMethod ===
                          DeliveryMethod.googleDrive ? (
                            <>
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Google Drive
                            </>
                          ) : (
                            "ZIP Files"
                          )}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {beat.artist}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Category
                          </p>
                          <p className="text-sm">{beat.category}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Style
                          </p>
                          <p className="text-sm">{beat.style}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Texture
                          </p>
                          <p className="text-sm">{beat.texture}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Status
                          </p>
                          <Badge
                            variant={beat.approved ? "default" : "secondary"}
                          >
                            {beat.approved ? "Approved" : "Pending"}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Preview
                        </p>
                        <Badge variant="secondary">
                          {beat.preview.previewType === "video"
                            ? "Video Audio"
                            : "Audio"}{" "}
                          - {Number(beat.preview.duration)}s
                        </Badge>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Delivery Method:{" "}
                          {beat.deliveryMethod === DeliveryMethod.googleDrive
                            ? "Google Drive Links"
                            : "ZIP Files"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Rights Folders ({beat.rightsFolders.length})
                        </p>
                        <div className="space-y-2">
                          {beat.rightsFolders.map((folder, index) => (
                            <div
                              key={`${folder.rightsType}-${index}`}
                              className="p-3 border border-border/40 rounded-lg bg-background/50"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {getRightsLabel(folder.rightsType)}
                                  </Badge>
                                  {folder.sold && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-muted text-muted-foreground"
                                    >
                                      SOLD
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-sm font-semibold">
                                  {folder.freeDownload
                                    ? "Free"
                                    : `$${(Number(folder.priceInCents) / 100).toFixed(2)}`}
                                </span>
                              </div>
                              {beat.deliveryMethod ===
                              DeliveryMethod.googleDrive ? (
                                <div className="text-xs">
                                  <span className="text-muted-foreground">
                                    Google Drive Link:
                                  </span>{" "}
                                  {folder.googleDriveLink ? (
                                    <a
                                      href={folder.googleDriveLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-500 hover:underline inline-flex items-center gap-1"
                                    >
                                      View Link{" "}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  ) : (
                                    "Not set"
                                  )}
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Audio Files:
                                    </span>{" "}
                                    {folder.audioFiles.length}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      License Docs:
                                    </span>{" "}
                                    {folder.licenseDocs.length}
                                  </div>
                                </div>
                              )}
                              {folder.sold && (
                                <div className="mt-2 pt-2 border-t border-border/40">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleReopenClick(
                                        beat.id,
                                        beat.title,
                                        folder,
                                      )
                                    }
                                    disabled={unmarkRightsAsSold.isPending}
                                    className="gap-2 text-primary hover:text-primary"
                                  >
                                    {unmarkRightsAsSold.isPending ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <RotateCcw className="h-3 w-3" />
                                    )}
                                    Reopen for Sale
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(beat)}
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit Beat
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(beat.id, beat.title)}
                          disabled={deleteBeat.isPending}
                          className="gap-2"
                        >
                          {deleteBeat.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete Beat
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-background/95 backdrop-blur-sm border-border/40">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Beat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{beatToDelete?.title}"? This
              action cannot be undone and will permanently remove the beat and
              all associated files from the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBeat.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteBeat.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBeat.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
        <AlertDialogContent className="bg-background/95 backdrop-blur-sm border-border/40">
          <AlertDialogHeader>
            <AlertDialogTitle>Reopen Rights for Sale</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reopen {rightsToReopen?.rightsLabel} for
              "{rightsToReopen?.beatTitle}"? This will allow customers to
              purchase these rights again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unmarkRightsAsSold.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReopen}
              disabled={unmarkRightsAsSold.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {unmarkRightsAsSold.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Reopening...
                </>
              ) : (
                "Reopen for Sale"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {beatToEdit && (
        <EditBeatDialog
          beat={beatToEdit}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      )}
    </>
  );
}
