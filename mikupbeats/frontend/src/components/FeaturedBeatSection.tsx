import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { useGetFeaturedBeat } from "../hooks/useQueries";

export default function FeaturedBeatSection() {
  const { data: featuredBeat, isLoading } = useGetFeaturedBeat();
  const { currentAudio, isPlaying, play, pause } = useAudioPlayer();
  const [coverArtUrl, setCoverArtUrl] = useState<string>("");
  const navigate = useNavigate();

  const previewUrl = featuredBeat?.preview.reference.getDirectURL();
  const isCurrentlyPlaying = currentAudio === previewUrl && isPlaying;

  useEffect(() => {
    if (featuredBeat?.coverArt?.[0]?.reference) {
      setCoverArtUrl(featuredBeat.coverArt[0].reference.getDirectURL());
    }
  }, [featuredBeat]);

  const handlePlayPause = () => {
    if (!featuredBeat || !previewUrl) return;

    if (isCurrentlyPlaying) {
      pause();
    } else {
      play(previewUrl);
    }
  };

  const handleViewBeat = () => {
    if (featuredBeat) {
      navigate({ to: `/beat/${featuredBeat.id}` });
    }
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-center py-12 bg-card/30 backdrop-blur-sm border border-primary/20 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!featuredBeat) {
    return null;
  }

  return (
    <div className="mb-8">
      <Card className="overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-background border-primary/30 shadow-lg shadow-primary/10">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🎧</span>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Featured Beat
            </h2>
          </div>

          <div className="grid md:grid-cols-[300px_1fr] gap-6">
            {/* Cover Art with Play Button */}
            <div className="relative group">
              <button
                type="button"
                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-300 w-full ${
                  isCurrentlyPlaying
                    ? "ring-4 ring-primary shadow-lg shadow-primary/50"
                    : "hover:ring-2 hover:ring-primary/50"
                }`}
                onClick={handlePlayPause}
              >
                {coverArtUrl ? (
                  <img
                    src={coverArtUrl}
                    alt={featuredBeat.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <span className="text-4xl">🎵</span>
                  </div>
                )}

                {/* Play/Pause Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {isCurrentlyPlaying ? (
                    <Pause className="h-16 w-16 text-white drop-shadow-lg" />
                  ) : (
                    <Play className="h-16 w-16 text-white drop-shadow-lg" />
                  )}
                </div>

                {/* Playing Indicator */}
                {isCurrentlyPlaying && (
                  <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold shadow-lg animate-pulse">
                    Playing
                  </div>
                )}
              </button>
            </div>

            {/* Beat Info */}
            <div className="flex flex-col justify-center space-y-4">
              <div>
                <h3 className="text-3xl font-bold mb-2">
                  {featuredBeat.title}
                </h3>
                <p className="text-xl text-muted-foreground mb-4">
                  by {featuredBeat.artist}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Experience this premium beat featuring {featuredBeat.style}{" "}
                  style with {featuredBeat.texture} texture. Perfect for your
                  next project.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handlePlayPause}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/20"
                >
                  {isCurrentlyPlaying ? (
                    <>
                      <Pause className="h-5 w-5 mr-2" />
                      Pause Preview
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Play Preview
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleViewBeat}
                  size="lg"
                  variant="outline"
                  className="border-primary/30 hover:bg-primary/10"
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
