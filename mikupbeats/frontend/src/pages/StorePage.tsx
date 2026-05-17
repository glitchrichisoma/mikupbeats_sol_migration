import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { BeatCategory, BeatStyle, BeatTexture, PageType } from "../backend";
import BeatCard from "../components/BeatCard";
import FeaturedBeatSection from "../components/FeaturedBeatSection";
import FundingMilestoneBanner from "../components/FundingMilestoneBanner";
import {
  useGetBeats,
  useIsCallerAdmin,
  useRecordSiteVisit,
} from "../hooks/useQueries";
import { isBeatExclusiveSold } from "../lib/beatRights";

export default function StorePage() {
  const { data: beats, isLoading } = useGetBeats();
  const { data: isAdmin } = useIsCallerAdmin();
  const recordVisit = useRecordSiteVisit();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [styleFilter, setStyleFilter] = useState<string>("all");
  const [textureFilter, setTextureFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // biome-ignore lint/correctness/useExhaustiveDependencies: recordVisit.mutate is stable, intentionally run once on mount
  useEffect(() => {
    // Record site visit when page loads
    recordVisit.mutate(PageType.store);

    const savedPosition = sessionStorage.getItem("storeScrollPosition");
    if (savedPosition) {
      window.scrollTo(0, Number.parseInt(savedPosition));
    }

    return () => {
      sessionStorage.setItem("storeScrollPosition", window.scrollY.toString());
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll-to-top intentionally depends on filter changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [categoryFilter, styleFilter, textureFilter]);

  const filteredBeats = beats?.filter((beat) => {
    // Apply category, style, texture filters
    if (categoryFilter !== "all" && beat.category !== categoryFilter)
      return false;
    if (styleFilter !== "all" && beat.style !== styleFilter) return false;
    if (textureFilter !== "all" && beat.texture !== textureFilter) return false;

    // Apply search filter (case-insensitive search by title or artist)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const titleMatch = beat.title.toLowerCase().includes(query);
      const artistMatch = beat.artist.toLowerCase().includes(query);
      if (!titleMatch && !artistMatch) return false;
    }

    // Hide Exclusive-sold beats from public listings (unless admin)
    if (!isAdmin && isBeatExclusiveSold(beat)) {
      return false;
    }

    return true;
  });

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-[#a970ff]">Beat Store</h1>
        <p className="text-muted-foreground">
          Browse and purchase premium beats
        </p>
      </div>

      {/* Featured Beat Section */}
      <FeaturedBeatSection />

      {/* Funding Milestone Banner */}
      <div className="mb-6">
        <FundingMilestoneBanner />
      </div>

      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search beats by name or artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-[#a970ff]/20 focus:border-[#a970ff]/40 focus:ring-[#a970ff]/20"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] bg-background border-border">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value={BeatCategory.hipHop}>Hip Hop</SelectItem>
              <SelectItem value={BeatCategory.pop}>Pop</SelectItem>
              <SelectItem value={BeatCategory.rock}>Rock</SelectItem>
              <SelectItem value={BeatCategory.electronic}>
                Electronic
              </SelectItem>
              <SelectItem value={BeatCategory.lofi}>Lo-Fi</SelectItem>
            </SelectContent>
          </Select>

          <Select value={styleFilter} onValueChange={setStyleFilter}>
            <SelectTrigger className="w-[180px] bg-background border-border">
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Styles</SelectItem>
              <SelectItem value={BeatStyle.oldSchool}>Old School</SelectItem>
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

          <Select value={textureFilter} onValueChange={setTextureFilter}>
            <SelectTrigger className="w-[180px] bg-background border-border">
              <SelectValue placeholder="Texture" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Textures</SelectItem>
              <SelectItem value={BeatTexture.smooth}>Smooth</SelectItem>
              <SelectItem value={BeatTexture.gritty}>Gritty</SelectItem>
              <SelectItem value={BeatTexture.melodic}>Melodic</SelectItem>
              <SelectItem value={BeatTexture.upbeat}>Upbeat</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {["s1", "s2", "s3", "s4", "s5", "s6"].map((k) => (
            <div
              key={k}
              className="rounded-lg overflow-hidden border border-border"
            >
              <div className="skeleton-block h-40 w-full rounded-none" />
              <div className="p-4 bg-card space-y-3">
                <div className="skeleton-block h-5 w-3/4" />
                <div className="skeleton-block h-4 w-1/2" />
                <div className="flex gap-2 mt-3">
                  <div className="skeleton-block h-8 flex-1" />
                  <div className="skeleton-block h-8 flex-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBeats?.map((beat) => (
            <BeatCard key={beat.id} beat={beat} />
          ))}
        </div>
      )}

      {!isLoading && filteredBeats?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No beats found matching your filters.
          </p>
        </div>
      )}
    </div>
  );
}
