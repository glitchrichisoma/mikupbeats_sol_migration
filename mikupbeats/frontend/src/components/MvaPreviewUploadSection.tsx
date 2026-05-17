import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Loader2,
  Music,
  Pause,
  Play,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import {
  useDeleteMvaPreview,
  useGetMvaPreview,
  useUploadMvaPreview,
} from "../hooks/useQueries";

export default function MvaPreviewUploadSection() {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadMvaPreview = useUploadMvaPreview();
  const { data: existingPreview, isLoading: loadingPreview } =
    useGetMvaPreview();
  const deleteMvaPreview = useDeleteMvaPreview();
  const { currentAudio, isPlaying, play, pause } = useAudioPlayer();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation - accept audio and video
    const isAudio = file.type.startsWith("audio/");
    const isVideo = file.type.startsWith("video/");

    if (!isAudio && !isVideo) {
      setError("Please upload an audio or video file");
      setMediaFile(null);
      setPreviewUrl(null);
      return;
    }

    setError(null);
    setMediaFile(file);

    // Create preview URL for playback
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!mediaFile) {
      setError("Please select an audio or video file");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Upload directly without any processing
      const arrayBuffer = await mediaFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress(
        (percentage) => {
          setUploadProgress(percentage);
        },
      );

      await uploadMvaPreview.mutateAsync(blob);

      toast.success(
        "M.v.A preview uploaded successfully! Server will handle all processing.",
      );
      setMediaFile(null);
      setPreviewUrl(null);
      setUploadProgress(0);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload M.v.A preview");
      toast.error("Failed to upload M.v.A preview");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMvaPreview.mutateAsync();
      toast.success("M.v.A preview deleted successfully!");
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err.message || "Failed to delete M.v.A preview");
    }
  };

  const handlePreviewPlay = () => {
    if (previewUrl) {
      if (currentAudio === previewUrl && isPlaying) {
        pause();
      } else {
        play(previewUrl);
      }
    }
  };

  const handleExistingPreviewPlay = () => {
    if (existingPreview) {
      const url = existingPreview.getDirectURL();
      if (currentAudio === url && isPlaying) {
        pause();
      } else {
        play(url);
      }
    }
  };

  const isPreviewPlaying =
    previewUrl && currentAudio === previewUrl && isPlaying;
  const existingPreviewUrl = existingPreview?.getDirectURL();
  const isExistingPlaying =
    existingPreviewUrl && currentAudio === existingPreviewUrl && isPlaying;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            M.v.A Preview Upload
          </CardTitle>
          <CardDescription>
            Upload audio or video files directly to the server. All processing
            happens server-side. Works seamlessly on iPhone and Safari.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Preview */}
          {existingPreview && !loadingPreview && (
            <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Music className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Current M.v.A Preview
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Media uploaded and processed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExistingPreviewPlay}
                    className="gap-2"
                  >
                    {isExistingPlaying ? (
                      <>
                        <Pause className="h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Play
                      </>
                    )}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete M.v.A Preview
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the M.v.A preview?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={deleteMvaPreview.isPending}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {deleteMvaPreview.isPending ? (
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
            </div>
          )}

          {/* Upload Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mva-media">Audio or Video File</Label>
              <Input
                id="mva-media"
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileChange}
                disabled={isUploading}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Upload audio (MP3, WAV, M4A) or video (MP4, WebM, MOV). Files
                are sent directly to the server for processing.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {mediaFile && !error && (
              <div className="space-y-3">
                <div className="rounded-lg border border-primary/20 bg-muted/50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-primary" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {mediaFile.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {(mediaFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePreviewPlay}
                      disabled={!previewUrl}
                      className="gap-2"
                    >
                      {isPreviewPlaying ? (
                        <>
                          <Pause className="h-4 w-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Play
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-center text-sm text-muted-foreground">
                      Uploading... {Math.round(uploadProgress)}%
                    </p>
                  </div>
                )}

                {!isUploading && (
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload M.v.A Preview
                  </Button>
                )}
              </div>
            )}

            {uploadMvaPreview.isSuccess && !isUploading && (
              <Alert className="border-primary/20 bg-primary/5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <AlertDescription className="text-primary">
                  M.v.A preview uploaded successfully! The server will process
                  it and it will appear on the M.v.A page.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
