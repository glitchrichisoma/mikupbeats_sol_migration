import { Music } from "lucide-react";
import type { PoSPRoomType } from "../../types/posp";

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v") ?? u.pathname.split("/").pop() ?? null;
    }
  } catch {
    /**/
  }
  return null;
}

function extractSpotifyEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("spotify.com")) {
      // Convert open.spotify.com/track/... -> open.spotify.com/embed/track/...
      const path = u.pathname.replace(/^\//, "");
      return `https://open.spotify.com/embed/${path}?utm_source=generator&theme=0`;
    }
  } catch {
    /**/
  }
  return null;
}

function extractSoundCloudEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("soundcloud.com")) {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23a970ff&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=true`;
    }
  } catch {
    /**/
  }
  return null;
}

interface EmbeddedPlayerProps {
  contentUrl: string;
  contentType: PoSPRoomType;
}

export default function EmbeddedPlayer({
  contentUrl,
  contentType,
}: EmbeddedPlayerProps) {
  if (!contentUrl.trim()) {
    return <WaveformPlaceholder label="No content linked" />;
  }

  // Native MikupBeats content -> waveform visualization
  if (contentType === "SonicHash") {
    return (
      <WaveformPlaceholder label="Sonic Hash Verification Active" native />
    );
  }

  // YouTube
  const ytId = extractYouTubeId(contentUrl);
  if (ytId) {
    return (
      <div className="w-full aspect-video rounded-lg overflow-hidden bg-secondary border border-border">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${ytId}?autoplay=0&rel=0&modestbranding=1`}
          title="YouTube player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  // Spotify
  const spotifyEmbed = extractSpotifyEmbed(contentUrl);
  if (spotifyEmbed) {
    return (
      <div className="w-full rounded-lg overflow-hidden bg-secondary border border-border">
        <iframe
          className="w-full"
          style={{ height: 152 }}
          src={spotifyEmbed}
          title="Spotify player"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      </div>
    );
  }

  // SoundCloud
  const scEmbed = extractSoundCloudEmbed(contentUrl);
  if (scEmbed) {
    return (
      <div className="w-full rounded-lg overflow-hidden bg-secondary border border-border">
        <iframe
          className="w-full"
          style={{ height: 166 }}
          scrolling="no"
          frameBorder="no"
          src={scEmbed}
          title="SoundCloud player"
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback
  return (
    <div className="w-full rounded-lg bg-secondary border border-border p-4 text-center">
      <a
        href={contentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline text-sm break-all"
      >
        {contentUrl}
      </a>
      <p className="text-xs text-muted-foreground mt-1">
        External link — opens in new tab
      </p>
    </div>
  );
}

const WAVEFORM_BARS = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
];

function WaveformPlaceholder({
  label,
  native,
}: { label: string; native?: boolean }) {
  return (
    <div className="w-full rounded-lg bg-secondary border border-primary/20 flex flex-col items-center justify-center py-10 gap-3">
      <div className="flex items-end gap-[3px] h-12">
        {WAVEFORM_BARS.map((id, i) => (
          <div
            key={id}
            className="w-1.5 rounded-full bg-primary"
            style={{
              height: `${30 + Math.sin(i * 0.5) * 40}%`,
              opacity: native ? 0.8 : 0.3,
              animationDuration: `${0.8 + (i % 5) * 0.1}s`,
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Music className="h-4 w-4" />
        {label}
      </div>
    </div>
  );
}
