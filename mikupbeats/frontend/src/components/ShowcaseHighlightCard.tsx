import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { Music2, Pause, Play } from "lucide-react";
import type { ShowcaseHighlight } from "../backend";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";

interface ShowcaseHighlightCardProps {
  highlight: ShowcaseHighlight;
}

export default function ShowcaseHighlightCard({
  highlight,
}: ShowcaseHighlightCardProps) {
  const { currentAudio, isPlaying, play, pause } = useAudioPlayer();
  const navigate = useNavigate();

  const audioUrl = highlight.highlightedSong.getDirectURL();
  const isCurrentlyPlaying = currentAudio === audioUrl && isPlaying;

  const handlePlayPause = () => {
    if (!audioUrl) return;

    if (isCurrentlyPlaying) {
      pause();
    } else {
      play(audioUrl);
    }
  };

  const handleViewFullMixtape = () => {
    navigate({ to: "/mixtapes" });
  };

  return (
    <Card
      className={`overflow-hidden bg-card/50 backdrop-blur-sm border-border/40 hover:border-primary/40 transition-all duration-300 ${
        isCurrentlyPlaying
          ? "ring-2 ring-primary shadow-xl shadow-primary/50 border-primary/60"
          : ""
      }`}
    >
      <CardHeader className="p-0">
        <button
          type="button"
          className={`relative aspect-video overflow-hidden cursor-pointer group w-full ${
            isCurrentlyPlaying
              ? "ring-2 ring-primary shadow-lg shadow-primary/50"
              : ""
          }`}
          onClick={handlePlayPause}
        >
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Music2 className="h-16 w-16 text-primary/40" />
          </div>

          {/* Play/Pause overlay indicator */}
          <div
            className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300 ${
              isCurrentlyPlaying
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <div
              className={`rounded-full bg-primary/90 p-4 transition-all duration-300 ${
                isCurrentlyPlaying
                  ? "animate-pulse shadow-lg shadow-primary/50"
                  : ""
              }`}
            >
              {isCurrentlyPlaying ? (
                <Pause className="h-8 w-8 text-primary-foreground" />
              ) : (
                <Play className="h-8 w-8 text-primary-foreground" />
              )}
            </div>
          </div>

          {/* Mixtape badge */}
          <div className="absolute top-2 left-2 z-10">
            <Badge className="bg-[#a970ff]/90 text-white backdrop-blur-sm text-xs">
              From Mixtape
            </Badge>
          </div>

          {/* Audio indicator */}
          <div className="absolute bottom-2 left-2 z-10">
            <Badge
              variant="secondary"
              className="bg-background/80 backdrop-blur-sm text-xs"
            >
              Featured Track
            </Badge>
          </div>
        </button>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="text-lg font-semibold mb-1">Featured Track</h3>
          <p className="text-sm text-muted-foreground">
            {highlight.artistName}
          </p>
        </div>

        <Button
          onClick={handleViewFullMixtape}
          variant="outline"
          size="sm"
          className="w-full border-[#a970ff]/40 hover:bg-[#a970ff]/10 hover:border-[#a970ff]/60"
        >
          <Music2 className="h-4 w-4 mr-2" />
          View Full Mixtape
        </Button>
      </CardContent>
    </Card>
  );
}
