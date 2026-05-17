import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit,
  ExternalLink,
  Loader2,
  Music2,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import {
  SiApplemusic,
  SiSoundcloud,
  SiSpotify,
  SiYoutube,
} from "react-icons/si";
import { toast } from "sonner";
import { ExternalBlob, type MusicLink, type Platform } from "../backend";
import {
  useAddMusicLink,
  useDeleteMusicLink,
  useGetMusicLinks,
  useIsCallerAdmin,
  useUpdateMusicLink,
} from "../hooks/useQueries";

export default function MusicLinksPage() {
  const { data: isAdmin, isLoading: _adminLoading } = useIsCallerAdmin();
  const { data: musicLinks, isLoading: linksLoading } = useGetMusicLinks();
  const addMusicLink = useAddMusicLink();
  const updateMusicLink = useUpdateMusicLink();
  const deleteMusicLink = useDeleteMusicLink();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<MusicLink | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    platform: "spotify" as
      | "spotify"
      | "appleMusic"
      | "youtube"
      | "soundcloud"
      | "other",
    otherPlatform: "",
    url: "",
    releaseDate: "",
    coverArt: null as File | null,
  });

  const [uploading, setUploading] = useState(false);

  if (linksLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#a970ff] border-t-transparent" />
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({
      title: "",
      platform: "spotify",
      otherPlatform: "",
      url: "",
      releaseDate: "",
      coverArt: null,
    });
    setEditingLink(null);
  };

  const handleAddLink = async () => {
    if (!formData.title || !formData.url) {
      toast.error("Please fill in all required fields");
      return;
    }

    setUploading(true);
    try {
      let coverArtBlob: ExternalBlob | null = null;
      if (formData.coverArt) {
        const bytes = new Uint8Array(await formData.coverArt.arrayBuffer());
        coverArtBlob = ExternalBlob.fromBytes(bytes);
      }

      let platform: Platform;
      if (formData.platform === "spotify") {
        platform = { __kind__: "spotify", spotify: null };
      } else if (formData.platform === "appleMusic") {
        platform = { __kind__: "appleMusic", appleMusic: null };
      } else if (formData.platform === "youtube") {
        platform = { __kind__: "youtube", youtube: null };
      } else if (formData.platform === "soundcloud") {
        platform = { __kind__: "soundcloud", soundcloud: null };
      } else {
        platform = {
          __kind__: "other",
          other: formData.otherPlatform || "Other",
        };
      }

      await addMusicLink.mutateAsync({
        title: formData.title,
        platform,
        url: formData.url,
        releaseDate: formData.releaseDate || null,
        coverArt: coverArtBlob,
      });

      toast.success("Music link added successfully");
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to add music link");
    } finally {
      setUploading(false);
    }
  };

  const handleEditLink = async () => {
    if (!editingLink || !formData.title || !formData.url) {
      toast.error("Please fill in all required fields");
      return;
    }

    setUploading(true);
    try {
      let coverArtBlob: ExternalBlob | null = null;
      if (formData.coverArt) {
        const bytes = new Uint8Array(await formData.coverArt.arrayBuffer());
        coverArtBlob = ExternalBlob.fromBytes(bytes);
      } else if (editingLink.coverArt) {
        coverArtBlob = editingLink.coverArt;
      }

      let platform: Platform;
      if (formData.platform === "spotify") {
        platform = { __kind__: "spotify", spotify: null };
      } else if (formData.platform === "appleMusic") {
        platform = { __kind__: "appleMusic", appleMusic: null };
      } else if (formData.platform === "youtube") {
        platform = { __kind__: "youtube", youtube: null };
      } else if (formData.platform === "soundcloud") {
        platform = { __kind__: "soundcloud", soundcloud: null };
      } else {
        platform = {
          __kind__: "other",
          other: formData.otherPlatform || "Other",
        };
      }

      await updateMusicLink.mutateAsync({
        title: formData.title,
        platform,
        url: formData.url,
        releaseDate: formData.releaseDate || null,
        coverArt: coverArtBlob,
      });

      toast.success("Music link updated successfully");
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to update music link");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLink = async (title: string) => {
    if (!confirm("Are you sure you want to delete this music link?")) return;

    try {
      await deleteMusicLink.mutateAsync(title);
      toast.success("Music link deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete music link");
    }
  };

  const openEditDialog = (link: MusicLink) => {
    setEditingLink(link);

    let platformType:
      | "spotify"
      | "appleMusic"
      | "youtube"
      | "soundcloud"
      | "other" = "spotify";
    let otherPlatform = "";

    if (link.platform.__kind__ === "spotify") platformType = "spotify";
    else if (link.platform.__kind__ === "appleMusic")
      platformType = "appleMusic";
    else if (link.platform.__kind__ === "youtube") platformType = "youtube";
    else if (link.platform.__kind__ === "soundcloud")
      platformType = "soundcloud";
    else {
      platformType = "other";
      otherPlatform = link.platform.other;
    }

    setFormData({
      title: link.title,
      platform: platformType,
      otherPlatform,
      url: link.url,
      releaseDate: link.releaseDate || "",
      coverArt: null,
    });
    setIsEditDialogOpen(true);
  };

  const getPlatformIcon = (platform: Platform) => {
    if (platform.__kind__ === "spotify")
      return <SiSpotify className="h-5 w-5" />;
    if (platform.__kind__ === "appleMusic")
      return <SiApplemusic className="h-5 w-5" />;
    if (platform.__kind__ === "youtube")
      return <SiYoutube className="h-5 w-5" />;
    if (platform.__kind__ === "soundcloud")
      return <SiSoundcloud className="h-5 w-5" />;
    return <Music2 className="h-5 w-5" />;
  };

  const getPlatformName = (platform: Platform) => {
    if (platform.__kind__ === "spotify") return "Spotify";
    if (platform.__kind__ === "appleMusic") return "Apple Music";
    if (platform.__kind__ === "youtube") return "YouTube";
    if (platform.__kind__ === "soundcloud") return "SoundCloud";
    return platform.other;
  };

  return (
    <div className="container py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-[#a970ff]">
            Official Music Links
          </h1>
          <p className="text-muted-foreground mb-4">
            This page features official releases by Malik Johnson, including
            songs and beats available on major streaming platforms. All links on
            this page lead directly to authorized releases on Spotify, Apple
            Music, YouTube, and other platforms.
          </p>

          {isAdmin && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-[#a970ff] hover:bg-[#a970ff]/90">
                  <Plus className="h-4 w-4" />
                  Add Music Link
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-[#a970ff]">
                    Add Music Link
                  </DialogTitle>
                  <DialogDescription>
                    Add a new official music release link
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Song/Beat Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Enter title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="platform">Platform *</Label>
                    <Select
                      value={formData.platform}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, platform: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spotify">Spotify</SelectItem>
                        <SelectItem value="appleMusic">Apple Music</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="soundcloud">SoundCloud</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.platform === "other" && (
                    <div>
                      <Label htmlFor="otherPlatform">Platform Name</Label>
                      <Input
                        id="otherPlatform"
                        value={formData.otherPlatform}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            otherPlatform: e.target.value,
                          })
                        }
                        placeholder="Enter platform name"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="url">URL *</Label>
                    <Input
                      id="url"
                      value={formData.url}
                      onChange={(e) =>
                        setFormData({ ...formData, url: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="releaseDate">Release Date (Optional)</Label>
                    <Input
                      id="releaseDate"
                      type="date"
                      value={formData.releaseDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          releaseDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="coverArt">Cover Art (Optional)</Label>
                    <Input
                      id="coverArt"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          coverArt: e.target.files?.[0] || null,
                        })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddLink}
                    disabled={uploading}
                    className="bg-[#a970ff] hover:bg-[#a970ff]/90"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Add Link"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {musicLinks && musicLinks.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {musicLinks.map((link) => (
              <Card
                key={link.title}
                className="overflow-hidden border-[#a970ff]/20 hover:border-[#a970ff]/40 transition-colors bg-card"
              >
                <CardHeader className="pb-4">
                  {link.coverArt && (
                    <div className="mb-4 aspect-square rounded-lg overflow-hidden border border-[#a970ff]/20">
                      <img
                        src={link.coverArt.getDirectURL()}
                        alt={link.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardTitle className="flex items-center gap-2">
                    {getPlatformIcon(link.platform)}
                    {link.title}
                  </CardTitle>
                  <CardDescription>
                    {getPlatformName(link.platform)}
                    {link.releaseDate && ` • ${link.releaseDate}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => window.open(link.url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open on {getPlatformName(link.platform)}
                  </Button>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => openEditDialog(link)}
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 gap-2 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteLink(link.title)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-[#a970ff]/20 bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Music2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-lg text-muted-foreground mb-2">
                No music links yet
              </p>
              {isAdmin && (
                <p className="text-sm text-muted-foreground/70 mb-4">
                  Add your first official release link
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-[#a970ff]">
                  Edit Music Link
                </DialogTitle>
                <DialogDescription>
                  Update music release information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Song/Beat Title *</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter title"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-platform">Platform *</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, platform: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spotify">Spotify</SelectItem>
                      <SelectItem value="appleMusic">Apple Music</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="soundcloud">SoundCloud</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.platform === "other" && (
                  <div>
                    <Label htmlFor="edit-otherPlatform">Platform Name</Label>
                    <Input
                      id="edit-otherPlatform"
                      value={formData.otherPlatform}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          otherPlatform: e.target.value,
                        })
                      }
                      placeholder="Enter platform name"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="edit-url">URL *</Label>
                  <Input
                    id="edit-url"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="edit-releaseDate">
                    Release Date (Optional)
                  </Label>
                  <Input
                    id="edit-releaseDate"
                    type="date"
                    value={formData.releaseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, releaseDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-coverArt">Cover Art (Optional)</Label>
                  <Input
                    id="edit-coverArt"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        coverArt: e.target.files?.[0] || null,
                      })
                    }
                  />
                  {editingLink?.coverArt && !formData.coverArt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Current cover art will be kept if no new file is selected
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditLink}
                  disabled={uploading}
                  className="bg-[#a970ff] hover:bg-[#a970ff]/90"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Update Link"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
