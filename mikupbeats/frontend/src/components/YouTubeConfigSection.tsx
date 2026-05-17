import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Trash2, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useGetYouTubeLiveUrl } from "../hooks/useQueries";

export default function YouTubeConfigSection() {
  const {
    url: currentUrl,
    saveUrl,
    deleteUrl,
    isLoading,
  } = useGetYouTubeLiveUrl();
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (currentUrl) {
      setYoutubeUrl(currentUrl);
    }
  }, [currentUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!youtubeUrl.trim()) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    if (
      !youtubeUrl.includes("youtube.com") &&
      !youtubeUrl.includes("youtu.be")
    ) {
      toast.error("Please enter a valid YouTube URL");
      return;
    }

    try {
      setIsSaving(true);
      saveUrl(youtubeUrl.trim());
      toast.success("YouTube live URL saved!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save URL");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      deleteUrl();
      setYoutubeUrl("");
      toast.success("YouTube live URL removed!");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove URL");
    } finally {
      setIsDeleting(false);
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
    <Card className="bg-card/50 backdrop-blur-sm border-border/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="h-6 w-6 text-red-500" />
          YouTube Live Configuration
        </CardTitle>
        <CardDescription>
          Configure the YouTube live stream embed URL
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="youtubeUrl">YouTube Live URL</Label>
            <Input
              id="youtubeUrl"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the full YouTube video or live stream URL
            </p>
          </div>

          {youtubeUrl && (
            <div className="border border-border/40 rounded-lg p-4 bg-muted/20">
              <p className="text-sm font-medium mb-2">Preview:</p>
              <div
                className="relative w-full"
                style={{ paddingBottom: "56.25%" }}
              >
                <iframe
                  title="YouTube Live Preview"
                  src={`https://www.youtube.com/embed/${
                    youtubeUrl.includes("youtu.be")
                      ? youtubeUrl.split("youtu.be/")[1]?.split("?")[0]
                      : new URL(youtubeUrl).searchParams.get("v")
                  }`}
                  className="absolute top-0 left-0 w-full h-full rounded"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save URL
                </>
              )}
            </Button>
            {currentUrl && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
