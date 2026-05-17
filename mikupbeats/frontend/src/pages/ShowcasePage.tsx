import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Pause,
  Play,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BeatCategory,
  BeatStyle,
  BeatTexture,
  ExternalBlob,
  PageType,
} from "../backend";
import ShowcaseCard from "../components/ShowcaseCard";
import ShowcaseHighlightCard from "../components/ShowcaseHighlightCard";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import {
  useGetApprovedShowcases,
  useGetBonusEarningConfig,
  useGetCallerUserProfile,
  useGetShowcaseHighlights,
  useRecordSiteVisit,
  useSubmitShowcase,
} from "../hooks/useQueries";
import { formatMIK97 } from "../utils/formatTokenAmount";

export default function ShowcasePage() {
  const { data: showcases, isLoading: showcasesLoading } =
    useGetApprovedShowcases();
  const { data: highlights, isLoading: highlightsLoading } =
    useGetShowcaseHighlights();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: bonusEarningConfig } = useGetBonusEarningConfig();
  const submitShowcase = useSubmitShowcase();
  const recordVisit = useRecordSiteVisit();
  const { play, pause, currentAudio, isPlaying } = useAudioPlayer();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Form fields
  const [songName, setSongName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [category, setCategory] = useState<BeatCategory | "">("");
  const [style, setStyle] = useState<BeatStyle | "">("");
  const [texture, setTexture] = useState<BeatTexture | "">("");
  const [beatId, setBeatId] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null);
  const [externalLink, setExternalLink] = useState("");

  const [audioProgress, setAudioProgress] = useState(0);
  const [coverProgress, setCoverProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // Audio validation state
  const [audioValidated, setAudioValidated] = useState(false);
  const [audioValidationError, setAudioValidationError] = useState<
    string | null
  >(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally omit to run once
  useEffect(() => {
    // Record site visit when page loads
    recordVisit.mutate(PageType.showcase);

    const savedPosition = sessionStorage.getItem("showcaseScrollPosition");
    if (savedPosition) {
      window.scrollTo(0, Number.parseInt(savedPosition));
    }

    return () => {
      sessionStorage.setItem(
        "showcaseScrollPosition",
        window.scrollY.toString(),
      );
    };
  }, []);

  useEffect(() => {
    // Pre-fill artist name from user profile
    if (userProfile && !artistName) {
      setArtistName(userProfile.name);
    }
  }, [userProfile, artistName]);

  const validateAudioFile = (file: File): boolean => {
    // Validate file extension
    const fileName = file.name.toLowerCase();
    const validExtensions = [".mp3", ".m4a", ".wav"];
    const hasValidExtension = validExtensions.some((ext) =>
      fileName.endsWith(ext),
    );

    if (!hasValidExtension) {
      setAudioValidationError("Audio files only (.mp3, .m4a, .wav)");
      return false;
    }

    // Validate MIME type
    const validMimeTypes = [
      "audio/mpeg",
      "audio/mp4",
      "audio/x-m4a",
      "audio/wav",
      "audio/x-wav",
    ];

    if (!validMimeTypes.includes(file.type)) {
      setAudioValidationError("Audio files only (.mp3, .m4a, .wav)");
      return false;
    }

    return true;
  };

  const handleAudioFileChange = async (file: File | null) => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    if (!file) {
      setAudioFile(null);
      setAudioUrl(null);
      setAudioValidated(false);
      setAudioValidationError(null);
      return;
    }

    // Validate audio file type
    if (!validateAudioFile(file)) {
      setAudioFile(null);
      setAudioUrl(null);
      setAudioValidated(false);
      toast.error("Audio files only (.mp3, .m4a, .wav)");
      return;
    }

    try {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setAudioValidated(true);
      setAudioValidationError(null);
      toast.success("Audio file validated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to process audio");
      setAudioFile(null);
      setAudioUrl(null);
      setAudioValidated(false);
      setAudioValidationError("Failed to process audio file");
    }
  };

  const handleCoverArtFileChange = (file: File | null) => {
    if (coverUrl) {
      URL.revokeObjectURL(coverUrl);
    }

    if (!file) {
      setCoverArtFile(null);
      setCoverUrl(null);
      return;
    }

    // Validate image file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const extension = file.name.split(".").pop()?.toLowerCase();
    const validExtensions = ["jpg", "jpeg", "png", "webp"];

    if (
      !validTypes.includes(file.type) &&
      !validExtensions.includes(extension || "")
    ) {
      toast.error("Please upload a JPG, PNG, or WEBP image file");
      return;
    }

    setCoverArtFile(file);
    const url = URL.createObjectURL(file);
    setCoverUrl(url);
  };

  const handleAudioPlayPause = () => {
    if (!audioUrl) return;

    if (currentAudio === audioUrl && isPlaying) {
      pause();
    } else {
      play(audioUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userProfile) {
      toast.error("Please complete your profile setup first");
      return;
    }

    // Validate required fields
    if (!songName || !artistName || !category || !style || !texture) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!audioFile) {
      toast.error("Please upload an audio file");
      return;
    }

    if (!audioValidated) {
      toast.error("Please upload a valid audio file (.mp3, .m4a, .wav)");
      return;
    }

    if (!coverArtFile) {
      toast.error("Please upload cover art");
      return;
    }

    try {
      // Upload audio file
      const audioBlob = ExternalBlob.fromBytes(
        new Uint8Array(await audioFile.arrayBuffer()),
      ).withUploadProgress((percentage) => setAudioProgress(percentage));

      // Upload cover art
      const coverBlob = ExternalBlob.fromBytes(
        new Uint8Array(await coverArtFile.arrayBuffer()),
      ).withUploadProgress((percentage) => setCoverProgress(percentage));

      await submitShowcase.mutateAsync({
        id: `showcase-${Date.now()}`,
        songName,
        artistName,
        category: category as BeatCategory,
        style: style as BeatStyle,
        texture: texture as BeatTexture,
        beatId: beatId || null,
        audioFile: audioBlob,
        coverArt: coverBlob,
        externalLink: externalLink || null,
      });

      toast.success("Showcase submitted for approval!");
      const showcaseBonus = bonusEarningConfig
        ? Number(bonusEarningConfig.showcaseUploadBonusTokens)
        : 50;
      toast.success(
        `+${formatMIK97(showcaseBonus)} MIK97 Showcase Upload Reward!`,
        {
          duration: 5000,
        },
      );

      // Clean up URLs
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (coverUrl) URL.revokeObjectURL(coverUrl);

      // Stop any playing audio
      pause();

      // Reset form
      setOpen(false);
      setSongName("");
      setArtistName(userProfile.name);
      setCategory("");
      setStyle("");
      setTexture("");
      setBeatId("");
      setAudioFile(null);
      setCoverArtFile(null);
      setExternalLink("");
      setAudioProgress(0);
      setCoverProgress(0);
      setAudioUrl(null);
      setCoverUrl(null);
      setAudioValidated(false);
      setAudioValidationError(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit showcase");
    }
  };

  // Combine showcases and highlights, filter by search query
  const allShowcaseItems = [
    ...(highlights || []).map((h) => ({ type: "highlight" as const, data: h })),
    ...(showcases || []).map((s) => ({ type: "showcase" as const, data: s })),
  ];

  const filteredItems = allShowcaseItems.filter((item) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (item.type === "highlight") {
        const artistMatch = item.data.artistName.toLowerCase().includes(query);
        if (!artistMatch) return false;
      } else {
        const songMatch = item.data.songName.toLowerCase().includes(query);
        const artistMatch = item.data.artistName.toLowerCase().includes(query);
        if (!songMatch && !artistMatch) return false;
      }
    }
    return true;
  });

  const isLoading = showcasesLoading || highlightsLoading;

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-[#a970ff]">Showcase</h1>
          <p className="text-muted-foreground">
            Artist submissions and creative works
          </p>
        </div>

        {userProfile && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-[#a970ff] hover:bg-[#a970ff]/90">
                <Plus className="h-4 w-4" />
                Submit Showcase
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl text-[#a970ff]">
                  Submit Your Showcase
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="songName">Song Name *</Label>
                  <Input
                    id="songName"
                    value={songName}
                    onChange={(e) => setSongName(e.target.value)}
                    placeholder="Enter song title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="artistName">Artist Name *</Label>
                  <Input
                    id="artistName"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="Enter artist name"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={category}
                      onValueChange={(value) =>
                        setCategory(value as BeatCategory)
                      }
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={BeatCategory.hipHop}>
                          Hip Hop
                        </SelectItem>
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
                    <Label htmlFor="style">Style *</Label>
                    <Select
                      value={style}
                      onValueChange={(value) => setStyle(value as BeatStyle)}
                    >
                      <SelectTrigger id="style">
                        <SelectValue placeholder="Select style" />
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
                        <SelectItem value={BeatStyle.classic}>
                          Classic
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="texture">Texture *</Label>
                    <Select
                      value={texture}
                      onValueChange={(value) =>
                        setTexture(value as BeatTexture)
                      }
                    >
                      <SelectTrigger id="texture">
                        <SelectValue placeholder="Select texture" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={BeatTexture.smooth}>
                          Smooth
                        </SelectItem>
                        <SelectItem value={BeatTexture.gritty}>
                          Gritty
                        </SelectItem>
                        <SelectItem value={BeatTexture.melodic}>
                          Melodic
                        </SelectItem>
                        <SelectItem value={BeatTexture.upbeat}>
                          Upbeat
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="beatId">Beat ID (Optional)</Label>
                  <Input
                    id="beatId"
                    value={beatId}
                    onChange={(e) => setBeatId(e.target.value)}
                    placeholder="Enter beat ID if applicable"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Reference the beat you used (if purchased from the store)
                  </p>
                </div>

                <div className="space-y-3 p-4 border border-[#a970ff]/20 rounded-lg bg-card">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Audio File *</h3>
                    {audioValidated && (
                      <div className="flex items-center gap-1 text-green-600 text-xs px-2 py-1 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Validated</span>
                      </div>
                    )}
                  </div>

                  <Alert className="border-[#a970ff]/20 bg-[#a970ff]/5">
                    <AlertCircle className="h-4 w-4 text-[#a970ff]" />
                    <AlertDescription className="text-xs">
                      Audio files only (.mp3, .m4a, .wav)
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label htmlFor="audioFile">
                      Audio File (.mp3, .m4a, .wav)
                    </Label>
                    <div className="flex gap-2 items-start">
                      <Input
                        id="audioFile"
                        type="file"
                        accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav,.mp3,.m4a,.wav"
                        onChange={(e) =>
                          handleAudioFileChange(e.target.files?.[0] || null)
                        }
                        className="flex-1 border-[#a970ff]/20 focus:ring-[#a970ff]/40"
                        required
                      />
                      {audioUrl && (
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={handleAudioPlayPause}
                          className="shrink-0 border-[#a970ff]/40 hover:bg-[#a970ff]/10"
                          title={
                            currentAudio === audioUrl && isPlaying
                              ? "Pause audio"
                              : "Play audio"
                          }
                        >
                          {currentAudio === audioUrl && isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    {audioValidationError && (
                      <p className="text-xs text-destructive mt-1">
                        {audioValidationError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 p-4 border border-[#a970ff]/20 rounded-lg bg-card">
                  <h3 className="font-semibold text-sm">Cover Art *</h3>
                  <p className="text-xs text-muted-foreground">
                    Upload cover artwork for your showcase (JPG, PNG, or WEBP)
                  </p>

                  <div>
                    <Label htmlFor="coverArt">Cover Art Image</Label>
                    <Input
                      id="coverArt"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                      onChange={(e) =>
                        handleCoverArtFileChange(e.target.files?.[0] || null)
                      }
                      required
                    />
                    {coverUrl && (
                      <div className="mt-2">
                        <img
                          src={coverUrl}
                          alt="Cover preview"
                          className="w-32 h-32 object-cover rounded border border-[#a970ff]/20"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="externalLink">External Link (Optional)</Label>
                  <Input
                    id="externalLink"
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Add a link to your social media, website, or streaming
                    platform
                  </p>
                </div>

                {audioProgress > 0 && audioProgress < 100 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading audio...</span>
                      <span>{audioProgress}%</span>
                    </div>
                    <Progress value={audioProgress} className="h-2" />
                  </div>
                )}

                {coverProgress > 0 && coverProgress < 100 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading cover art...</span>
                      <span>{coverProgress}%</span>
                    </div>
                    <Progress value={coverProgress} className="h-2" />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-[#a970ff] hover:bg-[#a970ff]/90"
                  disabled={submitShowcase.isPending || !audioValidated}
                >
                  {submitShowcase.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Submit Showcase
                    </>
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search showcases by song name or artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-[#a970ff]/20 focus:border-[#a970ff]/40 focus:ring-[#a970ff]/20"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#a970ff]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, _index) =>
            item.type === "highlight" ? (
              <ShowcaseHighlightCard
                key={`highlight-${item.data.mixtapeId}`}
                highlight={item.data}
              />
            ) : (
              <ShowcaseCard
                key={`showcase-${item.data.id}`}
                showcase={item.data}
              />
            ),
          )}
        </div>
      )}

      {!isLoading && filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery.trim()
              ? "No showcases found matching your search."
              : "No showcases available yet."}
          </p>
        </div>
      )}
    </div>
  );
}
