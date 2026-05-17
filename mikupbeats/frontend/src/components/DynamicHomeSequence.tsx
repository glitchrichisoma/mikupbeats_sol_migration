import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Focus, Sparkles, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";

interface DynamicHomeSequenceProps {
  className?: string;
}

export default function DynamicHomeSequence({
  className = "",
}: DynamicHomeSequenceProps) {
  const [animationIntensity, setAnimationIntensity] = useState<
    "subtle" | "normal" | "enhanced"
  >("normal");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioVolume, setAudioVolume] = useState(30);
  const [focusMode, setFocusMode] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Load settings from localStorage
  useEffect(() => {
    const savedIntensity = localStorage.getItem(
      "mikupbeats-animation-intensity",
    ) as "subtle" | "normal" | "enhanced" | null;
    const savedAudioEnabled =
      localStorage.getItem("mikupbeats-audio-enabled") === "true";
    const savedAudioVolume = localStorage.getItem("mikupbeats-audio-volume");
    const savedFocusMode =
      localStorage.getItem("mikupbeats-focus-mode") === "true";

    if (savedIntensity) setAnimationIntensity(savedIntensity);
    if (savedAudioVolume) setAudioVolume(Number.parseInt(savedAudioVolume));
    setAudioEnabled(savedAudioEnabled);
    setFocusMode(savedFocusMode);
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem("mikupbeats-animation-intensity", animationIntensity);
    localStorage.setItem("mikupbeats-audio-enabled", audioEnabled.toString());
    localStorage.setItem("mikupbeats-audio-volume", audioVolume.toString());
    localStorage.setItem("mikupbeats-focus-mode", focusMode.toString());
  }, [animationIntensity, audioEnabled, audioVolume, focusMode]);

  const shouldAnimate = !prefersReducedMotion && !focusMode;
  const intensityClass = shouldAnimate ? animationIntensity : "none";

  return (
    <>
      {/* Background Animation Layer */}
      <div
        className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}
        style={{ zIndex: 0 }}
        aria-hidden="true"
      >
        {/* Studio Background with Gradient Breathing */}
        <div
          className={`absolute inset-0 opacity-20 ${
            shouldAnimate && intensityClass !== "subtle"
              ? "animate-studio-breathe"
              : ""
          }`}
          style={{
            backgroundImage:
              "url(/assets/generated/studio-ambient-background.dim_1920x1080.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Gradient Overlay with Color Breathing */}
        <div
          className={`absolute inset-0 ${
            shouldAnimate ? "animate-gradient-breathe" : ""
          }`}
          style={{
            background:
              "radial-gradient(ellipse at center, oklch(0.25 0.15 290 / 0.3) 0%, oklch(0.15 0.02 270 / 0.8) 70%)",
          }}
        />

        {/* Pulsing Light Orbs */}
        {shouldAnimate && (
          <>
            <div
              className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl ${
                intensityClass === "enhanced"
                  ? "opacity-40"
                  : intensityClass === "normal"
                    ? "opacity-25"
                    : "opacity-15"
              } ${intensityClass !== "subtle" ? "animate-pulse-orb-1" : ""}`}
              style={{
                background:
                  "radial-gradient(circle, oklch(0.65 0.25 290 / 0.6) 0%, transparent 70%)",
              }}
            />
            <div
              className={`absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl ${
                intensityClass === "enhanced"
                  ? "opacity-35"
                  : intensityClass === "normal"
                    ? "opacity-20"
                    : "opacity-10"
              } ${intensityClass !== "subtle" ? "animate-pulse-orb-2" : ""}`}
              style={{
                background:
                  "radial-gradient(circle, oklch(0.70 0.20 320 / 0.5) 0%, transparent 70%)",
              }}
            />
          </>
        )}

        {/* Floating Particles */}
        {shouldAnimate && intensityClass !== "subtle" && (
          <div className="absolute inset-0">
            {[...Array(intensityClass === "enhanced" ? 20 : 12)].map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: static decorative array with no stable id
                key={`particle-${i}`}
                className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float-particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${15 + Math.random() * 10}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Studio Equipment Silhouettes with Glow */}
        {shouldAnimate && (
          <>
            <div
              className={`absolute bottom-0 left-10 opacity-10 ${
                intensityClass !== "subtle" ? "animate-equipment-glow-1" : ""
              }`}
              style={{
                width: "200px",
                height: "150px",
                backgroundImage:
                  "url(/assets/generated/studio-equipment-silhouette.dim_400x300.png)",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                filter: "drop-shadow(0 0 20px oklch(0.65 0.25 290 / 0.4))",
              }}
            />
            <div
              className={`absolute bottom-0 right-10 opacity-10 ${
                intensityClass !== "subtle" ? "animate-equipment-glow-2" : ""
              }`}
              style={{
                width: "200px",
                height: "150px",
                backgroundImage:
                  "url(/assets/generated/studio-equipment-silhouette.dim_400x300.png)",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                transform: "scaleX(-1)",
                filter: "drop-shadow(0 0 20px oklch(0.70 0.20 320 / 0.4))",
              }}
            />
          </>
        )}
      </div>

      {/* Control Panel */}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full bg-card/80 backdrop-blur-sm border-primary/30 hover:border-primary/60 shadow-lg"
              aria-label="Animation settings"
            >
              <Sparkles className="h-4 w-4 text-primary" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-64 bg-card/95 backdrop-blur-sm border-primary/30"
            align="end"
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">
                  Animation Intensity
                </h4>
                <div className="flex gap-2">
                  {(["subtle", "normal", "enhanced"] as const).map((level) => (
                    <Button
                      key={level}
                      variant={
                        animationIntensity === level ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setAnimationIntensity(level)}
                      className="flex-1 text-xs"
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Background Audio</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setAudioEnabled(!audioEnabled)}
                  >
                    {audioEnabled ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {audioEnabled && (
                  <Slider
                    value={[audioVolume]}
                    onValueChange={(value) => setAudioVolume(value[0])}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant={focusMode ? "default" : "outline"}
          size="icon"
          className="h-10 w-10 rounded-full bg-card/80 backdrop-blur-sm border-primary/30 hover:border-primary/60 shadow-lg"
          onClick={() => setFocusMode(!focusMode)}
          aria-label="Toggle focus mode"
        >
          <Focus className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}
