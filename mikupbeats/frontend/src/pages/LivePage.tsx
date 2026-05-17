import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  ExternalLink,
  Loader2,
  PlayCircle,
  Radio,
  Tv,
  WifiOff,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageType } from "../backend";
import LiveWatchRewards from "../components/LiveWatchRewards";
import {
  useGetReplays,
  useGetUpcomingShows,
  useGetYouTubeLiveUrl,
  useIsCallerAdmin,
  useRecordSiteVisit,
} from "../hooks/useQueries";
import { PoLSessionTracker } from "../utils/polTracker";

/**
 * Normalizes any YouTube URL format into a valid embed URL.
 * Handles:
 *   - https://www.youtube.com/watch?v=VIDEO_ID
 *   - https://youtu.be/VIDEO_ID
 *   - https://www.youtube.com/live/VIDEO_ID
 *   - https://www.youtube.com/embed/VIDEO_ID (already correct)
 * Returns null if the URL cannot be parsed into a valid embed URL.
 */
function toYouTubeEmbedUrl(url: string): string | null {
  if (!url || url.trim() === "") return null;

  try {
    const urlObj = new URL(url.trim());
    const hostname = urlObj.hostname.replace("www.", "");

    // Already an embed URL
    if (hostname === "youtube.com" && urlObj.pathname.startsWith("/embed/")) {
      return url.trim();
    }

    // youtube.com/watch?v=VIDEO_ID
    if (hostname === "youtube.com" && urlObj.pathname === "/watch") {
      const videoId = urlObj.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    // youtube.com/live/VIDEO_ID
    if (hostname === "youtube.com" && urlObj.pathname.startsWith("/live/")) {
      const videoId = urlObj.pathname.replace("/live/", "").split("?")[0];
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    // youtu.be/VIDEO_ID
    if (hostname === "youtu.be") {
      const videoId = urlObj.pathname.slice(1).split("?")[0];
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    // Fallback: return as-is if it looks like a YouTube URL
    if (hostname === "youtube.com") {
      return url.trim();
    }

    return null;
  } catch {
    return null;
  }
}

export default function LivePage() {
  const { url: liveUrl, isLoading } = useGetYouTubeLiveUrl();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: upcomingShows = [], isLoading: showsLoading } =
    useGetUpcomingShows();
  const { data: replays = [], isLoading: replaysLoading } = useGetReplays();
  const recordVisit = useRecordSiteVisit();
  const [embedError, setEmbedError] = useState(false);

  // PoL session tracker for live watching
  const polTrackerRef = useRef(new PoLSessionTracker());
  const polSessionIdRef = useRef("");

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally omit to run once
  useEffect(() => {
    recordVisit.mutate(PageType.live);
  }, []);

  // Reset embed error whenever the URL changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: liveUrl is the only meaningful dep
  useEffect(() => {
    setEmbedError(false);
  }, [liveUrl]);

  const embedUrl = liveUrl ? toYouTubeEmbedUrl(liveUrl) : null;

  // Start PoL tracking when live page mounts and stream is active
  // Track page visibility + time on page as the continuity signal
  useEffect(() => {
    if (embedUrl && !embedError) {
      polTrackerRef.current.start("live-stream", "live");
      polSessionIdRef.current = polTrackerRef.current.getSessionId();
    } else {
      if (polSessionIdRef.current) {
        polTrackerRef.current.stop();
        polSessionIdRef.current = "";
      }
    }
    return () => {
      polTrackerRef.current.pausePlayback();
    };
  }, [embedUrl, embedError]);

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-[#a970ff] flex items-center gap-3">
          <Radio className="h-10 w-10" />
          Live Stream
        </h1>
        <p className="text-muted-foreground">
          Watch live beat-making sessions and catch up on past streams
        </p>
      </div>

      {/* YouTube Embed Area */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#a970ff]" />
        </div>
      ) : !embedUrl ? (
        /* No URL configured */
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-[#a970ff]/20 bg-card/50 py-16 px-8 text-center">
            <Tv className="h-14 w-14 text-[#a970ff]/40" />
            <div>
              <p className="text-lg font-semibold text-foreground/80">
                {isAdmin
                  ? "No live stream configured."
                  : "No live stream is currently configured."}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isAdmin
                  ? "Visit the Admin page → YouTube tab to set up a YouTube live stream URL."
                  : "Check back soon!"}
              </p>
            </div>
          </div>
        </div>
      ) : embedError ? (
        /* URL is set but embed failed to load */
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-[#a970ff]/20 bg-card/50 py-16 px-8 text-center">
            <WifiOff className="h-14 w-14 text-[#a970ff]/40" />
            <div>
              <p className="text-lg font-semibold text-foreground/80">
                Stream is currently offline.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Please check back later — the stream will appear here when it
                goes live.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Valid URL, render the embed */
        <div className="max-w-5xl mx-auto mb-12">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              key={embedUrl}
              src={embedUrl}
              title="Live stream"
              className="absolute top-0 left-0 w-full h-full rounded-lg border-2 border-[#a970ff]/20"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onError={() => setEmbedError(true)}
            />
          </div>
        </div>
      )}

      {/* Watch Reward Widget — visible when stream is active or user is logged in */}
      <div className="max-w-5xl mx-auto mb-8">
        <LiveWatchRewards streamActive={!!embedUrl && !embedError} />
      </div>

      <Separator className="my-12" />

      {/* Upcoming Shows Section */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="h-8 w-8 text-[#a970ff]" />
          <h2 className="text-3xl font-bold text-[#a970ff]">Upcoming Shows</h2>
        </div>

        {showsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#a970ff]" />
          </div>
        ) : upcomingShows.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingShows.map((show) => (
              <Card
                key={show.title}
                className="border-[#a970ff]/20 hover:border-[#a970ff]/40 transition-colors bg-card"
              >
                <CardHeader>
                  <CardTitle className="text-xl">{show.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {show.date} at {show.time}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {show.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Alert className="border-[#a970ff]/20">
            <AlertDescription className="text-center">
              No upcoming shows scheduled at the moment. Check back soon!
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Separator className="my-12" />

      {/* Replays Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <PlayCircle className="h-8 w-8 text-[#a970ff]" />
          <h2 className="text-3xl font-bold text-[#a970ff]">Replays</h2>
        </div>

        {replaysLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#a970ff]" />
          </div>
        ) : replays.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {replays.map((replay) => (
              <Card
                key={replay.title}
                className="border-[#a970ff]/20 hover:border-[#a970ff]/40 transition-colors bg-card"
              >
                <CardHeader>
                  <CardTitle className="text-xl">{replay.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {replay.description}
                  </p>
                  <Button
                    asChild
                    className="w-full bg-[#a970ff] hover:bg-[#a970ff]/90"
                  >
                    <a
                      href={replay.replayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Watch Replay
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Alert className="border-[#a970ff]/20">
            <AlertDescription className="text-center">
              No replays available yet. Past streams will appear here!
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
