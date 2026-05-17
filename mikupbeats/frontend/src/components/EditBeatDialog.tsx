import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Loader2, Pause, Play, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type Beat,
  BeatCategory,
  BeatStyle,
  BeatTexture,
  CoverArtType,
  DeliveryMethod,
  ExternalBlob,
  PreviewType,
  type RightsFolder,
  RightsType,
} from "../backend";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { useUpdateBeat } from "../hooks/useQueries";

interface EditBeatDialogProps {
  beat: Beat;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditBeatDialog({
  beat,
  open,
  onOpenChange,
}: EditBeatDialogProps) {
  const updateBeat = useUpdateBeat();
  const { play, pause, currentAudio, isPlaying } = useAudioPlayer();

  const [title, setTitle] = useState(beat.title);
  const [artist, setArtist] = useState(beat.artist);
  const [category, setCategory] = useState<BeatCategory>(beat.category);
  const [style, setStyle] = useState<BeatStyle>(beat.style);
  const [texture, setTexture] = useState<BeatTexture>(beat.texture);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    beat.deliveryMethod,
  );

  // Preview
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [keepExistingPreview, setKeepExistingPreview] = useState(true);

  // Cover art
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [keepExistingCover, setKeepExistingCover] = useState(true);

  // Rights folders - ZIP files
  const [basicRightZip, _setBasicRightZip] = useState<File | null>(null);
  const [basicRightPrice, setBasicRightPrice] = useState("");
  const [basicRightFree, setBasicRightFree] = useState(false);
  const [keepBasicRightZip, _setKeepBasicRightZip] = useState(true);

  const [premiumRightZip, _setPremiumRightZip] = useState<File | null>(null);
  const [premiumRightPrice, setPremiumRightPrice] = useState("");
  const [premiumRightFree, setPremiumRightFree] = useState(false);
  const [keepPremiumRightZip, _setKeepPremiumRightZip] = useState(true);

  const [exclusiveRightZip, _setExclusiveRightZip] = useState<File | null>(
    null,
  );
  const [exclusiveRightPrice, setExclusiveRightPrice] = useState("");
  const [exclusiveRightFree, setExclusiveRightFree] = useState(false);
  const [keepExclusiveRightZip, _setKeepExclusiveRightZip] = useState(true);

  const [stemsZip, _setStemsZip] = useState<File | null>(null);
  const [stemsPrice, setStemsPrice] = useState("");
  const [stemsFree, setStemsFree] = useState(false);
  const [keepStemsZip, _setKeepStemsZip] = useState(true);

  // Google Drive links
  const [basicRightDriveLink, setBasicRightDriveLink] = useState("");
  const [premiumRightDriveLink, setPremiumRightDriveLink] = useState("");
  const [exclusiveRightDriveLink, setExclusiveRightDriveLink] = useState("");
  const [stemsDriveLink, setStemsDriveLink] = useState("");

  // Initialize form with existing beat data
  useEffect(() => {
    if (beat) {
      setTitle(beat.title);
      setArtist(beat.artist);
      setCategory(beat.category);
      setStyle(beat.style);
      setTexture(beat.texture);
      setDeliveryMethod(beat.deliveryMethod);

      // Initialize rights folders
      for (const folder of beat.rightsFolders) {
        const price = (Number(folder.priceInCents) / 100).toFixed(2);
        const isFree = folder.freeDownload;

        switch (folder.rightsType) {
          case RightsType.basicRight:
            setBasicRightPrice(price);
            setBasicRightFree(isFree);
            if (folder.googleDriveLink) {
              setBasicRightDriveLink(folder.googleDriveLink);
            }
            break;
          case RightsType.premiumRight:
            setPremiumRightPrice(price);
            setPremiumRightFree(isFree);
            if (folder.googleDriveLink) {
              setPremiumRightDriveLink(folder.googleDriveLink);
            }
            break;
          case RightsType.exclusiveRight:
            setExclusiveRightPrice(price);
            setExclusiveRightFree(isFree);
            if (folder.googleDriveLink) {
              setExclusiveRightDriveLink(folder.googleDriveLink);
            }
            break;
          case RightsType.stems:
            setStemsPrice(price);
            setStemsFree(isFree);
            if (folder.googleDriveLink) {
              setStemsDriveLink(folder.googleDriveLink);
            }
            break;
        }
      }
    }
  }, [beat]);

  const handlePreviewFileChange = (file: File | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!file) {
      setPreviewFile(null);
      setPreviewUrl(null);
      setKeepExistingPreview(true);
      return;
    }

    const isAudio = file.type.startsWith("audio/");
    const isVideo = file.type.startsWith("video/");

    if (!isAudio && !isVideo) {
      toast.error("Please upload an audio or video file");
      setPreviewFile(null);
      setPreviewUrl(null);
      return;
    }

    setPreviewFile(file);
    setKeepExistingPreview(false);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handlePreviewPlayPause = () => {
    if (!previewUrl) return;

    if (currentAudio === previewUrl && isPlaying) {
      pause();
    } else {
      play(previewUrl);
    }
  };

  const validateGoogleDriveLink = (link: string): boolean => {
    if (!link.trim()) return false;

    const drivePatterns = [
      /^https?:\/\/drive\.google\.com\//i,
      /^https?:\/\/docs\.google\.com\//i,
    ];

    return drivePatterns.some((pattern) => pattern.test(link.trim()));
  };

  const processRightsFolder = async (
    zipFile: File | null,
    driveLink: string,
    price: string,
    isFree: boolean,
    rightsType: RightsType,
    keepExisting: boolean,
    existingFolder?: RightsFolder,
  ): Promise<RightsFolder | null> => {
    // If keeping existing and no changes, return existing folder
    if (keepExisting && existingFolder && !zipFile && !driveLink.trim()) {
      return existingFolder;
    }

    // Check if using ZIP files
    if (deliveryMethod === DeliveryMethod.zipFiles) {
      // If no new file and not keeping existing, skip this folder
      if (!zipFile && !keepExisting) return null;

      // If keeping existing, use existing ZIP
      if (keepExisting && existingFolder && !zipFile) {
        return {
          ...existingFolder,
          priceInCents: isFree
            ? BigInt(0)
            : BigInt(Math.round(Number.parseFloat(price || "0") * 100)),
          freeDownload: isFree,
        };
      }

      // Validate new ZIP file
      if (zipFile && !zipFile.name.toLowerCase().endsWith(".zip")) {
        throw new Error(`${rightsType} must be a ZIP file`);
      }

      // Convert new ZIP file to ExternalBlob
      const zipBlob = zipFile
        ? ExternalBlob.fromBytes(new Uint8Array(await zipFile.arrayBuffer()))
        : existingFolder?.zipFile || ExternalBlob.fromBytes(new Uint8Array(0));

      return {
        rightsType,
        priceInCents: isFree
          ? BigInt(0)
          : BigInt(Math.round(Number.parseFloat(price || "0") * 100)),
        freeDownload: isFree,
        sold: existingFolder?.sold || false,
        audioFiles: [],
        licenseDocs: [],
        zipFile: zipBlob,
        googleDriveLink: undefined,
      };
    }
    // Using Google Drive links
    const trimmedLink = driveLink.trim();

    // If no link provided and not keeping existing, skip this folder
    if (!trimmedLink && !keepExisting) return null;

    // If keeping existing, use existing link
    if (keepExisting && existingFolder && !trimmedLink) {
      return {
        ...existingFolder,
        priceInCents: isFree
          ? BigInt(0)
          : BigInt(Math.round(Number.parseFloat(price || "0") * 100)),
        freeDownload: isFree,
      };
    }

    // Validate new Google Drive link
    if (trimmedLink && !validateGoogleDriveLink(trimmedLink)) {
      throw new Error(
        `${rightsType}: Please provide a valid Google Drive URL (must start with https://drive.google.com/ or https://docs.google.com/)`,
      );
    }

    const placeholderBlob = ExternalBlob.fromBytes(new Uint8Array(0));

    return {
      rightsType,
      priceInCents: isFree
        ? BigInt(0)
        : BigInt(Math.round(Number.parseFloat(price || "0") * 100)),
      freeDownload: isFree,
      sold: existingFolder?.sold || false,
      audioFiles: [],
      licenseDocs: [],
      zipFile: placeholderBlob,
      googleDriveLink: trimmedLink || existingFolder?.googleDriveLink,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please provide a title");
      return;
    }

    if (!artist.trim()) {
      toast.error("Please provide an artist name");
      return;
    }

    try {
      // Process preview
      let preview = beat.preview;
      if (!keepExistingPreview && previewFile) {
        const previewBlob = ExternalBlob.fromBytes(
          new Uint8Array(await previewFile.arrayBuffer()),
        ).withUploadProgress((percentage) => setPreviewProgress(percentage));

        const isVideo = previewFile.type.startsWith("video/");

        preview = {
          previewType: isVideo ? PreviewType.video : PreviewType.audio,
          assetId: `preview-${Date.now()}`,
          reference: previewBlob,
          duration: BigInt(0),
          description: `${isVideo ? "Video" : "Audio"} preview`,
        };
      }

      // Process cover art
      let coverArt = beat.coverArt;
      if (!keepExistingCover && coverFile) {
        const coverBlob = ExternalBlob.fromBytes(
          new Uint8Array(await coverFile.arrayBuffer()),
        );
        const coverExtension = coverFile.name.split(".").pop()?.toLowerCase();
        let coverType = CoverArtType.jpg;
        if (coverExtension === "png") coverType = CoverArtType.png;
        else if (coverExtension === "webp") coverType = CoverArtType.webp;

        coverArt = [
          {
            fileType: coverType,
            assetId: `cover-${Date.now()}`,
            reference: coverBlob,
            description: "Cover art",
          },
        ];
      }

      // Process rights folders
      const rightsFolders: RightsFolder[] = [];

      const existingBasic = beat.rightsFolders.find(
        (f) => f.rightsType === RightsType.basicRight,
      );
      const basicFolder = await processRightsFolder(
        basicRightZip,
        basicRightDriveLink,
        basicRightPrice,
        basicRightFree,
        RightsType.basicRight,
        keepBasicRightZip,
        existingBasic,
      );
      if (basicFolder) rightsFolders.push(basicFolder);

      const existingPremium = beat.rightsFolders.find(
        (f) => f.rightsType === RightsType.premiumRight,
      );
      const premiumFolder = await processRightsFolder(
        premiumRightZip,
        premiumRightDriveLink,
        premiumRightPrice,
        premiumRightFree,
        RightsType.premiumRight,
        keepPremiumRightZip,
        existingPremium,
      );
      if (premiumFolder) rightsFolders.push(premiumFolder);

      const existingExclusive = beat.rightsFolders.find(
        (f) => f.rightsType === RightsType.exclusiveRight,
      );
      const exclusiveFolder = await processRightsFolder(
        exclusiveRightZip,
        exclusiveRightDriveLink,
        exclusiveRightPrice,
        exclusiveRightFree,
        RightsType.exclusiveRight,
        keepExclusiveRightZip,
        existingExclusive,
      );
      if (exclusiveFolder) rightsFolders.push(exclusiveFolder);

      const existingStems = beat.rightsFolders.find(
        (f) => f.rightsType === RightsType.stems,
      );
      const stemsFolder = await processRightsFolder(
        stemsZip,
        stemsDriveLink,
        stemsPrice,
        stemsFree,
        RightsType.stems,
        keepStemsZip,
        existingStems,
      );
      if (stemsFolder) rightsFolders.push(stemsFolder);

      if (rightsFolders.length === 0) {
        toast.error("Please provide at least one rights folder");
        return;
      }

      // Call the backend updateBeat function
      await updateBeat.mutateAsync({
        id: beat.id,
        title: title.trim(),
        artist: artist.trim(),
        category,
        style,
        texture,
        coverArt,
        preview,
        rightsFolders,
        deliveryMethod,
      });

      toast.success(`Beat "${title}" updated successfully!`);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      pause();

      onOpenChange(false);
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update beat. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background/95 backdrop-blur-sm border-border/40 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Beat</DialogTitle>
          <DialogDescription>
            Update beat details, media, and delivery settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-artist">Artist *</Label>
              <Input
                id="edit-artist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as BeatCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BeatCategory.hipHop}>Hip Hop</SelectItem>
                  <SelectItem value={BeatCategory.pop}>Pop</SelectItem>
                  <SelectItem value={BeatCategory.rock}>Rock</SelectItem>
                  <SelectItem value={BeatCategory.electronic}>
                    Electronic
                  </SelectItem>
                  <SelectItem value={BeatCategory.lofi}>Lo-Fi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-style">Style</Label>
              <Select
                value={style}
                onValueChange={(value) => setStyle(value as BeatStyle)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BeatStyle.oldSchool}>
                    Old School
                  </SelectItem>
                  <SelectItem value={BeatStyle.modern}>Modern</SelectItem>
                  <SelectItem value={BeatStyle.experimental}>
                    Experimental
                  </SelectItem>
                  <SelectItem value={BeatStyle.trap}>Trap</SelectItem>
                  <SelectItem value={BeatStyle.jazzInfluence}>
                    Jazz Influence
                  </SelectItem>
                  <SelectItem value={BeatStyle.classic}>Classic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-texture">Texture</Label>
              <Select
                value={texture}
                onValueChange={(value) => setTexture(value as BeatTexture)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BeatTexture.smooth}>Smooth</SelectItem>
                  <SelectItem value={BeatTexture.gritty}>Gritty</SelectItem>
                  <SelectItem value={BeatTexture.melodic}>Melodic</SelectItem>
                  <SelectItem value={BeatTexture.upbeat}>Upbeat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 p-4 border border-primary/20 rounded-lg bg-primary/5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                Preview (Audio or Video)
              </h3>
              {keepExistingPreview && (
                <Badge variant="secondary" className="text-xs">
                  Using existing preview
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={keepExistingPreview}
                onCheckedChange={(checked) => {
                  setKeepExistingPreview(checked as boolean);
                  if (checked) {
                    setPreviewFile(null);
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }
                }}
              />
              <Label className="text-xs cursor-pointer">
                Keep existing preview
              </Label>
            </div>

            {!keepExistingPreview && (
              <div>
                <Label htmlFor="edit-previewFile">
                  New Preview File (Audio/Video)
                </Label>
                <div className="flex gap-2 items-start">
                  <Input
                    id="edit-previewFile"
                    type="file"
                    accept="audio/*,video/*"
                    onChange={(e) =>
                      handlePreviewFileChange(e.target.files?.[0] || null)
                    }
                    className="border-primary/20 focus:ring-primary/40 flex-1"
                  />
                  {previewUrl && (
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={handlePreviewPlayPause}
                      className="shrink-0 border-primary/40 hover:bg-primary/10"
                    >
                      {currentAudio === previewUrl && isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                {previewFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {previewFile.name} (
                    {(previewFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3 p-4 border border-primary/20 rounded-lg bg-primary/5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Cover Art</h3>
              {keepExistingCover && (
                <Badge variant="secondary" className="text-xs">
                  Using existing cover
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={keepExistingCover}
                onCheckedChange={(checked) => {
                  setKeepExistingCover(checked as boolean);
                  if (checked) {
                    setCoverFile(null);
                  }
                }}
              />
              <Label className="text-xs cursor-pointer">
                Keep existing cover art
              </Label>
            </div>

            {!keepExistingCover && (
              <div>
                <Label htmlFor="edit-coverFile">New Cover Art</Label>
                <Input
                  id="edit-coverFile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                />
                {coverFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {coverFile.name}
                  </p>
                )}
              </div>
            )}
          </div>

          {previewProgress > 0 && previewProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{previewProgress}%</span>
              </div>
              <Progress value={previewProgress} className="h-2" />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateBeat.isPending}>
              {updateBeat.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Update Beat
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
