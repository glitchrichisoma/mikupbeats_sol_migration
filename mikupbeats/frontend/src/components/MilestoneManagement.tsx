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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Edit, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Milestone } from "../backend";
import { ExternalBlob } from "../backend";
import {
  useDeleteMilestone,
  useGetMilestones,
  useSaveMilestone,
} from "../hooks/useQueries";

export default function MilestoneManagement() {
  const { data: milestones = [], isLoading } = useGetMilestones();
  const saveMilestone = useSaveMilestone();
  const deleteMilestone = useDeleteMilestone();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<{
    id: string;
    milestone: Milestone;
  } | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    description: "",
  });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const resetForm = () => {
    setFormData({ title: "", date: "", description: "" });
    setMediaFile(null);
    setMediaPreview(null);
    setEditingMilestone(null);
  };

  const handleEdit = (id: string, milestone: Milestone) => {
    setEditingMilestone({ id, milestone });
    setFormData({
      title: milestone.title,
      date: milestone.date,
      description: milestone.description,
    });
    if (milestone.media) {
      setMediaPreview(milestone.media.getDirectURL());
    }
    setIsDialogOpen(true);
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.date || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsUploading(true);

    try {
      let mediaBlob: ExternalBlob | null = null;

      if (mediaFile) {
        const arrayBuffer = await mediaFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        mediaBlob = ExternalBlob.fromBytes(uint8Array);
      } else if (editingMilestone?.milestone.media) {
        mediaBlob = editingMilestone.milestone.media;
      }

      const order = editingMilestone
        ? editingMilestone.milestone.order
        : BigInt(milestones.length);
      const id = editingMilestone
        ? editingMilestone.id
        : `milestone-${Date.now()}`;

      const milestone: Milestone = {
        title: formData.title,
        date: formData.date,
        description: formData.description,
        media: mediaBlob || undefined,
        order,
      };

      await saveMilestone.mutateAsync({ id, milestone });

      toast.success(
        editingMilestone
          ? "Milestone updated successfully"
          : "Milestone created successfully",
      );
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error saving milestone:", error);
      toast.error(error.message || "Failed to save milestone");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMilestone.mutateAsync(id);
      toast.success("Milestone deleted successfully");
    } catch (error: any) {
      console.error("Error deleting milestone:", error);
      toast.error(error.message || "Failed to delete milestone");
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Timeline Milestones</h2>
          <p className="text-muted-foreground">
            Manage Malik Johnson's creative milestones and achievements
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Milestone
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMilestone ? "Edit Milestone" : "Add New Milestone"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., First Album Release"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  placeholder="e.g., January 2024"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of the milestone (1-2 sentences)"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="media">Media (Optional)</Label>
                <Input
                  id="media"
                  type="file"
                  accept="image/*"
                  onChange={handleMediaChange}
                />
                {mediaPreview && (
                  <div className="mt-2 relative w-full h-48 rounded-lg overflow-hidden border border-primary/20">
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {editingMilestone ? "Update" : "Create"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {milestones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No milestones yet. Click "Add Milestone" to create your first one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {milestones.map((milestone, index) => (
            <Card
              key={milestone.title}
              className="border-primary/20 hover:border-primary/40 transition-colors"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-xl">{milestone.title}</CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {milestone.date}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleEdit(`milestone-${index}`, milestone)
                      }
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Milestone</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{milestone.title}"?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(`milestone-${index}`)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {milestone.media && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-primary/20">
                    <img
                      src={milestone.media.getDirectURL()}
                      alt={milestone.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <p className="text-sm text-foreground/80">
                  {milestone.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
