import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type React from "react";
import { useState } from "react";
import { useCreateSection } from "../hooks/useQueries";

interface CreateThreadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateThreadDialog({
  open,
  onOpenChange,
}: CreateThreadDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkSharingEnabled, setLinkSharingEnabled] = useState(false);
  const createSectionMutation = useCreateSection();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      const sectionId = `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await createSectionMutation.mutateAsync({
        id: sectionId,
        title: title.trim(),
        description: description.trim(),
        linkSharingEnabled,
      });
      setTitle("");
      setDescription("");
      setLinkSharingEnabled(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create section:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-purple-400">
            Create New Chat Room
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a new chat room for community discussions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground">
              Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter chat room title"
              className="bg-background border-border text-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">
              Description *
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter chat room description"
              className="min-h-[100px] bg-background border-border text-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="link-sharing" className="text-foreground">
                  Enable Link Sharing
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow URLs in messages to be displayed as clickable links
                </p>
              </div>
              <Switch
                id="link-sharing"
                checked={linkSharingEnabled}
                onCheckedChange={setLinkSharingEnabled}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-background border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !title.trim() ||
                !description.trim() ||
                createSectionMutation.isPending
              }
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {createSectionMutation.isPending
                ? "Creating..."
                : "Create Chat Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
