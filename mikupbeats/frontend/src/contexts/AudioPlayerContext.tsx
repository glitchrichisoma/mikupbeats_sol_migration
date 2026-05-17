import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

interface AudioPlayerContextType {
  currentAudio: string | null;
  isPlaying: boolean;
  play: (audioUrl: string) => void;
  pause: () => void;
  stop: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(
  undefined,
);

export function AudioPlayerProvider({
  children,
}: { children: React.ReactNode }) {
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(
    (audioUrl: string) => {
      if (!audioRef.current) return;

      // If same audio and currently paused, resume playback
      if (currentAudio === audioUrl && !isPlaying) {
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error("Error resuming audio:", error);
            setIsPlaying(false);
          });
      }
      // If different audio, load and play new audio
      else if (currentAudio !== audioUrl) {
        audioRef.current.src = audioUrl;
        audioRef.current.load(); // Ensure audio is loaded
        audioRef.current
          .play()
          .then(() => {
            setCurrentAudio(audioUrl);
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error("Error playing audio:", error);
            setIsPlaying(false);
          });
      }
    },
    [currentAudio, isPlaying],
  );

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentAudio(null);
    }
  }, []);

  // Handle audio element events
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{ currentAudio, isPlaying, play, pause, stop, audioRef }}
    >
      {children}
      {/* biome-ignore lint/a11y/useMediaCaption: background audio player, no visual content requiring captions */}
      <audio
        ref={audioRef}
        onEnded={handleEnded}
        onPause={handlePause}
        onPlay={handlePlay}
      />
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }
  return context;
}
