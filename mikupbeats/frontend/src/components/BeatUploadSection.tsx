import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useState } from "react";
import { toast } from "sonner";
import {
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
import { useUploadBeat } from "../hooks/useQueries";

export default function BeatUploadSection() {
  const uploadBeat = useUploadBeat();
  const { play, pause, currentAudio, isPlaying } = useAudioPlayer();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [category, setCategory] = useState<BeatCategory>(BeatCategory.hipHop);
  const [style, setStyle] = useState<BeatStyle>(BeatStyle.modern);
  const [texture, setTexture] = useState<BeatTexture>(BeatTexture.smooth);

  // Delivery method selection
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    DeliveryMethod.zipFiles,
  );

  // Single preview - no processing
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewProgress, setPreviewProgress] = useState(0);

  // Cover art
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Rights folders - ZIP files
  const [basicRightZip, setBasicRightZip] = useState<File | null>(null);
  const [basicRightPrice, setBasicRightPrice] = useState("");
  const [basicRightFree, setBasicRightFree] = useState(false);

  const [premiumRightZip, setPremiumRightZip] = useState<File | null>(null);
  const [premiumRightPrice, setPremiumRightPrice] = useState("");
  const [premiumRightFree, setPremiumRightFree] = useState(false);

  const [exclusiveRightZip, setExclusiveRightZip] = useState<File | null>(null);
  const [exclusiveRightPrice, setExclusiveRightPrice] = useState("");
  const [exclusiveRightFree, setExclusiveRightFree] = useState(false);

  const [stemsZip, setStemsZip] = useState<File | null>(null);
  const [stemsPrice, setStemsPrice] = useState("");
  const [stemsFree, setStemsFree] = useState(false);

  // Google Drive links
  const [basicRightDriveLink, setBasicRightDriveLink] = useState("");
  const [premiumRightDriveLink, setPremiumRightDriveLink] = useState("");
  const [exclusiveRightDriveLink, setExclusiveRightDriveLink] = useState("");
  const [stemsDriveLink, setStemsDriveLink] = useState("");

  const handlePreviewFileChange = (file: File | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!file) {
      setPreviewFile(null);
      setPreviewUrl(null);
      return;
    }

    // Basic validation only - no processing
    const isAudio = file.type.startsWith("audio/");
    const isVideo = file.type.startsWith("video/");

    if (!isAudio && !isVideo) {
      toast.error("Please upload an audio or video file");
      setPreviewFile(null);
      setPreviewUrl(null);
      return;
    }

    setPreviewFile(file);
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

    // Accept any properly formatted Google Drive URL
    // Common patterns: drive.google.com, docs.google.com
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
  ): Promise<RightsFolder | null> => {
    // Check if using ZIP files
    if (deliveryMethod === DeliveryMethod.zipFiles) {
      if (!zipFile) return null;

      // Validate that it's a ZIP file
      if (!zipFile.name.toLowerCase().endsWith(".zip")) {
        throw new Error(`${rightsType} must be a ZIP file`);
      }

      // Convert ZIP file to ExternalBlob
      const zipBlob = ExternalBlob.fromBytes(
        new Uint8Array(await zipFile.arrayBuffer()),
      );

      return {
        rightsType,
        priceInCents: isFree
          ? BigInt(0)
          : BigInt(Math.round(Number.parseFloat(price || "0") * 100)),
        freeDownload: isFree,
        sold: false,
        audioFiles: [],
        licenseDocs: [],
        zipFile: zipBlob,
        googleDriveLink: undefined,
      };
    }
    // Using Google Drive links
    const trimmedLink = driveLink.trim();
    if (!trimmedLink) return null;

    // Validate Google Drive link format
    if (!validateGoogleDriveLink(trimmedLink)) {
      throw new Error(
        `${rightsType}: Please provide a valid Google Drive URL (must start with https://drive.google.com/ or https://docs.google.com/)`,
      );
    }

    // Create a placeholder ZIP blob (required by backend type but not used)
    const placeholderBlob = ExternalBlob.fromBytes(new Uint8Array(0));

    return {
      rightsType,
      priceInCents: isFree
        ? BigInt(0)
        : BigInt(Math.round(Number.parseFloat(price || "0") * 100)),
      freeDownload: isFree,
      sold: false,
      audioFiles: [],
      licenseDocs: [],
      zipFile: placeholderBlob,
      googleDriveLink: trimmedLink,
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

    if (!coverFile) {
      toast.error("Please provide cover art");
      return;
    }

    if (!previewFile) {
      toast.error("Please provide a preview file (audio or video)");
      return;
    }

    // Check at least one rights folder based on delivery method
    if (deliveryMethod === DeliveryMethod.zipFiles) {
      if (
        !basicRightZip &&
        !premiumRightZip &&
        !exclusiveRightZip &&
        !stemsZip
      ) {
        toast.error("Please provide at least one rights folder ZIP file");
        return;
      }
    } else {
      if (
        !basicRightDriveLink.trim() &&
        !premiumRightDriveLink.trim() &&
        !exclusiveRightDriveLink.trim() &&
        !stemsDriveLink.trim()
      ) {
        toast.error("Please provide at least one Google Drive link");
        return;
      }
    }

    // Validate pricing for non-free folders
    const validatePricing = (
      hasContent: boolean,
      price: string,
      isFree: boolean,
      label: string,
    ) => {
      if (hasContent && !isFree && (!price || Number.parseFloat(price) < 0)) {
        throw new Error(
          `Please provide a valid price for ${label} or mark it as free`,
        );
      }
    };

    try {
      if (deliveryMethod === DeliveryMethod.zipFiles) {
        validatePricing(
          !!basicRightZip,
          basicRightPrice,
          basicRightFree,
          "Basic Right",
        );
        validatePricing(
          !!premiumRightZip,
          premiumRightPrice,
          premiumRightFree,
          "Premium Right",
        );
        validatePricing(
          !!exclusiveRightZip,
          exclusiveRightPrice,
          exclusiveRightFree,
          "Exclusive Right",
        );
        validatePricing(!!stemsZip, stemsPrice, stemsFree, "Stems");
      } else {
        validatePricing(
          !!basicRightDriveLink.trim(),
          basicRightPrice,
          basicRightFree,
          "Basic Right",
        );
        validatePricing(
          !!premiumRightDriveLink.trim(),
          premiumRightPrice,
          premiumRightFree,
          "Premium Right",
        );
        validatePricing(
          !!exclusiveRightDriveLink.trim(),
          exclusiveRightPrice,
          exclusiveRightFree,
          "Exclusive Right",
        );
        validatePricing(
          !!stemsDriveLink.trim(),
          stemsPrice,
          stemsFree,
          "Stems",
        );
      }
    } catch (error: any) {
      toast.error(error.message);
      return;
    }

    try {
      // Upload preview directly without processing
      const previewBlob = ExternalBlob.fromBytes(
        new Uint8Array(await previewFile.arrayBuffer()),
      ).withUploadProgress((percentage) => setPreviewProgress(percentage));

      // Determine preview type from file
      const isVideo = previewFile.type.startsWith("video/");

      const preview = {
        previewType: isVideo ? PreviewType.video : PreviewType.audio,
        assetId: `preview-${Date.now()}`,
        reference: previewBlob,
        duration: BigInt(0), // Server will handle duration extraction
        description: `${isVideo ? "Video" : "Audio"} preview`,
      };

      // Process cover art
      const coverBlob = ExternalBlob.fromBytes(
        new Uint8Array(await coverFile.arrayBuffer()),
      );
      const coverExtension = coverFile.name.split(".").pop()?.toLowerCase();
      let coverType = CoverArtType.jpg;
      if (coverExtension === "png") coverType = CoverArtType.png;
      else if (coverExtension === "webp") coverType = CoverArtType.webp;

      const coverArt = [
        {
          fileType: coverType,
          assetId: `cover-${Date.now()}`,
          reference: coverBlob,
          description: "Cover art",
        },
      ];

      // Process rights folders
      const rightsFolders: RightsFolder[] = [];

      const basicFolder = await processRightsFolder(
        basicRightZip,
        basicRightDriveLink,
        basicRightPrice,
        basicRightFree,
        RightsType.basicRight,
      );
      if (basicFolder) rightsFolders.push(basicFolder);

      const premiumFolder = await processRightsFolder(
        premiumRightZip,
        premiumRightDriveLink,
        premiumRightPrice,
        premiumRightFree,
        RightsType.premiumRight,
      );
      if (premiumFolder) rightsFolders.push(premiumFolder);

      const exclusiveFolder = await processRightsFolder(
        exclusiveRightZip,
        exclusiveRightDriveLink,
        exclusiveRightPrice,
        exclusiveRightFree,
        RightsType.exclusiveRight,
      );
      if (exclusiveFolder) rightsFolders.push(exclusiveFolder);

      const stemsFolder = await processRightsFolder(
        stemsZip,
        stemsDriveLink,
        stemsPrice,
        stemsFree,
        RightsType.stems,
      );
      if (stemsFolder) rightsFolders.push(stemsFolder);

      // Call the backend uploadBeat function
      const result = await uploadBeat.mutateAsync({
        id: `beat-${Date.now()}`,
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

      toast.success(
        `Beat "${result.title}" uploaded successfully! It will appear in the Store and Beat Management immediately.`,
      );

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      pause();

      // Reset form
      setTitle("");
      setArtist("");
      setPreviewFile(null);
      setCoverFile(null);
      setBasicRightZip(null);
      setBasicRightPrice("");
      setBasicRightFree(false);
      setPremiumRightZip(null);
      setPremiumRightPrice("");
      setPremiumRightFree(false);
      setExclusiveRightZip(null);
      setExclusiveRightPrice("");
      setExclusiveRightFree(false);
      setStemsZip(null);
      setStemsPrice("");
      setStemsFree(false);
      setBasicRightDriveLink("");
      setPremiumRightDriveLink("");
      setExclusiveRightDriveLink("");
      setStemsDriveLink("");
      setPreviewProgress(0);
      setPreviewUrl(null);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload beat. Please try again.");
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/40">
      <CardHeader>
        <CardTitle>Upload New Beat</CardTitle>
        <CardDescription>
          Add a new beat with preview and delivery method. Choose between ZIP
          file uploads or Google Drive links.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="artist">Artist *</Label>
              <Input
                id="artist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
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
              <Label htmlFor="style">Style</Label>
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
              <Label htmlFor="texture">Texture</Label>
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
                Preview (Audio or Video) - Required
              </h3>
              {previewFile && (
                <div className="flex items-center gap-1 text-green-600 text-xs px-2 py-1 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Ready</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload audio (MP3, WAV, M4A) or video (MP4, WebM, MOV). Files are
              uploaded directly to the server for processing.
            </p>

            <div>
              <Label htmlFor="previewFile">Preview File (Audio/Video) *</Label>
              <div className="flex gap-2 items-start">
                <Input
                  id="previewFile"
                  type="file"
                  accept="audio/*,video/*"
                  onChange={(e) =>
                    handlePreviewFileChange(e.target.files?.[0] || null)
                  }
                  className="border-primary/20 focus:ring-primary/40 flex-1"
                  required
                />
                {previewUrl && (
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={handlePreviewPlayPause}
                    className="shrink-0 border-primary/40 hover:bg-primary/10"
                    title={
                      currentAudio === previewUrl && isPlaying
                        ? "Pause preview"
                        : "Play preview"
                    }
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
          </div>

          <div>
            <Label htmlFor="coverFile">Cover Art *</Label>
            <Input
              id="coverFile"
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              required
            />
            {coverFile && (
              <p className="text-xs text-muted-foreground mt-1">
                Selected: {coverFile.name}
              </p>
            )}
          </div>

          <div className="space-y-4 p-4 border border-primary/30 rounded-lg bg-primary/5">
            <div>
              <h3 className="font-semibold mb-3">Delivery Method *</h3>
              <RadioGroup
                value={deliveryMethod}
                onValueChange={(value) =>
                  setDeliveryMethod(value as DeliveryMethod)
                }
              >
                <div className="flex items-center space-x-2 p-3 border border-border/40 rounded-lg bg-background/50 hover:bg-background/70 transition-colors">
                  <RadioGroupItem
                    value={DeliveryMethod.zipFiles}
                    id="zip-method"
                  />
                  <Label htmlFor="zip-method" className="flex-1 cursor-pointer">
                    <div className="font-medium">ZIP File Upload</div>
                    <div className="text-xs text-muted-foreground">
                      Upload ZIP files containing audio and license documents
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-border/40 rounded-lg bg-background/50 hover:bg-background/70 transition-colors">
                  <RadioGroupItem
                    value={DeliveryMethod.googleDrive}
                    id="drive-method"
                  />
                  <Label
                    htmlFor="drive-method"
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-medium">Google Drive Links</div>
                    <div className="text-xs text-muted-foreground">
                      Provide Google Drive folder links for each rights type
                      (any valid Google Drive URL accepted)
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <h3 className="font-semibold">
              Rights Folders (At least one required)
            </h3>
            <p className="text-xs text-muted-foreground">
              {deliveryMethod === DeliveryMethod.zipFiles
                ? "Upload a ZIP file for each rights type. Each ZIP should contain audio files and license documents."
                : "Provide Google Drive folder links for each rights type. Any properly formatted Google Drive URL is accepted (drive.google.com or docs.google.com)."}
            </p>

            {/* Basic Right */}
            <div className="space-y-3 p-3 border border-border/40 rounded-lg bg-background/50">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Basic Right</Label>
                <Badge variant="outline">Optional</Badge>
              </div>
              {deliveryMethod === DeliveryMethod.zipFiles ? (
                <div>
                  <Label htmlFor="basicRightZip" className="text-xs">
                    ZIP File
                  </Label>
                  <Input
                    id="basicRightZip"
                    type="file"
                    accept=".zip"
                    onChange={(e) =>
                      setBasicRightZip(e.target.files?.[0] || null)
                    }
                    className="text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {basicRightZip
                      ? `Selected: ${basicRightZip.name}`
                      : "Select a ZIP file"}
                  </p>
                </div>
              ) : (
                <div>
                  <Label htmlFor="basicRightDriveLink" className="text-xs">
                    Google Drive Link
                  </Label>
                  <Input
                    id="basicRightDriveLink"
                    type="url"
                    value={basicRightDriveLink}
                    onChange={(e) => setBasicRightDriveLink(e.target.value)}
                    placeholder="https://drive.google.com/... or https://docs.google.com/..."
                    className="text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter any valid Google Drive URL
                  </p>
                </div>
              )}
              {(basicRightZip || basicRightDriveLink.trim()) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="basicRightPrice" className="text-xs">
                      Price (USD)
                    </Label>
                    <Input
                      id="basicRightPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={basicRightPrice}
                      onChange={(e) => setBasicRightPrice(e.target.value)}
                      disabled={basicRightFree}
                      className="text-xs"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-end">
                    <label
                      htmlFor="basic-right-free"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        id="basic-right-free"
                        checked={basicRightFree}
                        onCheckedChange={(checked) =>
                          setBasicRightFree(checked as boolean)
                        }
                      />
                      <span className="text-xs">Free Download</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Premium Right */}
            <div className="space-y-3 p-3 border border-border/40 rounded-lg bg-background/50">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Premium Right</Label>
                <Badge variant="outline">Optional</Badge>
              </div>
              {deliveryMethod === DeliveryMethod.zipFiles ? (
                <div>
                  <Label htmlFor="premiumRightZip" className="text-xs">
                    ZIP File
                  </Label>
                  <Input
                    id="premiumRightZip"
                    type="file"
                    accept=".zip"
                    onChange={(e) =>
                      setPremiumRightZip(e.target.files?.[0] || null)
                    }
                    className="text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {premiumRightZip
                      ? `Selected: ${premiumRightZip.name}`
                      : "Select a ZIP file"}
                  </p>
                </div>
              ) : (
                <div>
                  <Label htmlFor="premiumRightDriveLink" className="text-xs">
                    Google Drive Link
                  </Label>
                  <Input
                    id="premiumRightDriveLink"
                    type="url"
                    value={premiumRightDriveLink}
                    onChange={(e) => setPremiumRightDriveLink(e.target.value)}
                    placeholder="https://drive.google.com/... or https://docs.google.com/..."
                    className="text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter any valid Google Drive URL
                  </p>
                </div>
              )}
              {(premiumRightZip || premiumRightDriveLink.trim()) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="premiumRightPrice" className="text-xs">
                      Price (USD)
                    </Label>
                    <Input
                      id="premiumRightPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={premiumRightPrice}
                      onChange={(e) => setPremiumRightPrice(e.target.value)}
                      disabled={premiumRightFree}
                      className="text-xs"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-end">
                    <label
                      htmlFor="premium-right-free"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        id="premium-right-free"
                        checked={premiumRightFree}
                        onCheckedChange={(checked) =>
                          setPremiumRightFree(checked as boolean)
                        }
                      />
                      <span className="text-xs">Free Download</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Exclusive Right */}
            <div className="space-y-3 p-3 border border-border/40 rounded-lg bg-background/50">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Exclusive Right</Label>
                <Badge variant="outline">Optional</Badge>
              </div>
              {deliveryMethod === DeliveryMethod.zipFiles ? (
                <div>
                  <Label htmlFor="exclusiveRightZip" className="text-xs">
                    ZIP File
                  </Label>
                  <Input
                    id="exclusiveRightZip"
                    type="file"
                    accept=".zip"
                    onChange={(e) =>
                      setExclusiveRightZip(e.target.files?.[0] || null)
                    }
                    className="text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {exclusiveRightZip
                      ? `Selected: ${exclusiveRightZip.name}`
                      : "Select a ZIP file"}
                  </p>
                </div>
              ) : (
                <div>
                  <Label htmlFor="exclusiveRightDriveLink" className="text-xs">
                    Google Drive Link
                  </Label>
                  <Input
                    id="exclusiveRightDriveLink"
                    type="url"
                    value={exclusiveRightDriveLink}
                    onChange={(e) => setExclusiveRightDriveLink(e.target.value)}
                    placeholder="https://drive.google.com/... or https://docs.google.com/..."
                    className="text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter any valid Google Drive URL
                  </p>
                </div>
              )}
              {(exclusiveRightZip || exclusiveRightDriveLink.trim()) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="exclusiveRightPrice" className="text-xs">
                      Price (USD)
                    </Label>
                    <Input
                      id="exclusiveRightPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={exclusiveRightPrice}
                      onChange={(e) => setExclusiveRightPrice(e.target.value)}
                      disabled={exclusiveRightFree}
                      className="text-xs"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-end">
                    <label
                      htmlFor="exclusive-right-free"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        id="exclusive-right-free"
                        checked={exclusiveRightFree}
                        onCheckedChange={(checked) =>
                          setExclusiveRightFree(checked as boolean)
                        }
                      />
                      <span className="text-xs">Free Download</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Stems */}
            <div className="space-y-3 p-3 border border-border/40 rounded-lg bg-background/50">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Stems</Label>
                <Badge variant="outline">Optional</Badge>
              </div>
              {deliveryMethod === DeliveryMethod.zipFiles ? (
                <div>
                  <Label htmlFor="stemsZip" className="text-xs">
                    ZIP File
                  </Label>
                  <Input
                    id="stemsZip"
                    type="file"
                    accept=".zip"
                    onChange={(e) => setStemsZip(e.target.files?.[0] || null)}
                    className="text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {stemsZip
                      ? `Selected: ${stemsZip.name}`
                      : "Select a ZIP file"}
                  </p>
                </div>
              ) : (
                <div>
                  <Label htmlFor="stemsDriveLink" className="text-xs">
                    Google Drive Link
                  </Label>
                  <Input
                    id="stemsDriveLink"
                    type="url"
                    value={stemsDriveLink}
                    onChange={(e) => setStemsDriveLink(e.target.value)}
                    placeholder="https://drive.google.com/... or https://docs.google.com/..."
                    className="text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter any valid Google Drive URL
                  </p>
                </div>
              )}
              {(stemsZip || stemsDriveLink.trim()) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="stemsPrice" className="text-xs">
                      Price (USD)
                    </Label>
                    <Input
                      id="stemsPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={stemsPrice}
                      onChange={(e) => setStemsPrice(e.target.value)}
                      disabled={stemsFree}
                      className="text-xs"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-end">
                    <label
                      htmlFor="stems-free"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        id="stems-free"
                        checked={stemsFree}
                        onCheckedChange={(checked) =>
                          setStemsFree(checked as boolean)
                        }
                      />
                      <span className="text-xs">Free Download</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {previewProgress > 0 && previewProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading preview...</span>
                <span>{previewProgress}%</span>
              </div>
              <Progress value={previewProgress} className="h-2" />
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={uploadBeat.isPending}
          >
            {uploadBeat.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading Beat...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Beat
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
