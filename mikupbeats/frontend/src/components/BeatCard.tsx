import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { Download, Loader2, Pause, Play, ShoppingCart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { type Beat, PreviewType, RightsType } from "../backend";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateCheckoutSession,
  useRecordBeatPurchase,
  useRecordMusicReward,
} from "../hooks/useQueries";
import { useStripePreflight } from "../hooks/useStripePreflight";
import {
  canPurchaseRights,
  getRightsLabel,
  isBeatExclusiveSold,
} from "../lib/beatRights";
import {
  logCheckoutEvent,
  sanitizeErrorForLogging,
} from "../lib/checkoutDebug";
import {
  isValidStripeCheckoutUrl,
  sanitizeCheckoutError,
} from "../lib/stripeCheckout";
import { PoLSessionTracker } from "../utils/polTracker";
import {
  createPendingPaidPurchase,
  storeFreePurchase,
} from "../utils/purchaseTracking";
import { showMusicRewardToast } from "./MusicRewardToast";

interface BeatCardProps {
  beat: Beat;
}

export default function BeatCard({ beat }: BeatCardProps) {
  const navigate = useNavigate();
  const { currentAudio, isPlaying, play, pause } = useAudioPlayer();
  const { identity } = useInternetIdentity();
  const createCheckout = useCreateCheckoutSession();
  const recordPurchase = useRecordBeatPurchase();
  const recordMusicReward = useRecordMusicReward();
  const {
    isStripeConfigured,
    canStartPaidCheckout,
    checkoutUnavailableMessage,
  } = useStripePreflight();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchasingRightIndex, setPurchasingRightIndex] = useState<
    number | null
  >(null);

  // Music reward tracking — 30-second interval timer
  const listenSecondsRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track which beat IDs have shown a cooldown toast this session (suppress repeats)
  const cooldownShownRef = useRef<Set<string>>(new Set());
  // PoL session tracker
  const polTrackerRef = useRef<PoLSessionTracker>(new PoLSessionTracker());
  const polActiveRef = useRef(false);

  const coverArtUrl = beat.coverArt[0]?.reference.getDirectURL();
  const previewUrl = beat.preview?.reference.getDirectURL();
  const isVideo = beat.preview?.previewType === PreviewType.video;
  const isCurrentlyPlaying = currentAudio === previewUrl && isPlaying;
  const isExclusiveSold = isBeatExclusiveSold(beat);
  const isLoggedIn = !!(identity && !identity.getPrincipal().isAnonymous());

  // 60s preview cutoff
  useEffect(() => {
    if (isCurrentlyPlaying && previewUrl) {
      const audio = document.querySelector("audio");
      if (audio) {
        const handleTimeUpdate = () => {
          if (audio.currentTime >= 60) {
            pause();
            audio.currentTime = 0;
          }
        };
        audio.addEventListener("timeupdate", handleTimeUpdate);
        return () => {
          audio.removeEventListener("timeupdate", handleTimeUpdate);
        };
      }
    }
  }, [isCurrentlyPlaying, previewUrl, pause]);

  // Music reward: 1 MIK97 per 30 seconds of active listening (PoL-enhanced)
  useEffect(() => {
    if (isCurrentlyPlaying && isLoggedIn && previewUrl) {
      // Start PoL tracker when playback begins
      if (!polActiveRef.current) {
        polActiveRef.current = true;
        polTrackerRef.current.start(beat.id, "beat");
      } else {
        polTrackerRef.current.resumePlayback();
      }

      // Start or resume the per-second counter
      if (!intervalRef.current) {
        intervalRef.current = setInterval(async () => {
          listenSecondsRef.current += 1;
          if (
            listenSecondsRef.current > 0 &&
            listenSecondsRef.current % 30 === 0
          ) {
            // Hit a 30-second threshold — call backend with PoL confidence
            const confidenceScore =
              polTrackerRef.current.getCurrentConfidence();
            const sessionId = polTrackerRef.current.getSessionId();
            try {
              const result = await recordMusicReward.mutateAsync({
                contentType: "beat",
                contentId: beat.id,
                rewardType: "play",
                sessionId,
                confidenceScore,
              });
              const earned = Number(result);
              if (earned > 0) {
                showMusicRewardToast({ amount: earned, type: "earned" });
              } else if (earned === 0) {
                if (!cooldownShownRef.current.has(beat.id)) {
                  cooldownShownRef.current.add(beat.id);
                  showMusicRewardToast({
                    amount: 0,
                    type: "cooldown",
                    contentLabel: "beat",
                  });
                } else {
                  showMusicRewardToast({ amount: 0, type: "cap_reached" });
                }
              }
            } catch {
              // Silently ignore (not logged in, network error, etc.)
            }
          }
        }, 1000);
      }
    } else {
      // Pause: clear interval and pause PoL tracker
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (polActiveRef.current) {
        polTrackerRef.current.pausePlayback();
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    isCurrentlyPlaying,
    isLoggedIn,
    previewUrl,
    beat.id,
    recordMusicReward.mutateAsync,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset listen counter and PoL tracker when beat src changes (new beat selected)
  const prevPreviewUrlRef = useRef<string | undefined>(undefined);
  if (prevPreviewUrlRef.current !== previewUrl) {
    prevPreviewUrlRef.current = previewUrl;
    listenSecondsRef.current = 0;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (polActiveRef.current) {
      polTrackerRef.current.stop();
      polActiveRef.current = false;
    }
    polTrackerRef.current.reset();
  }

  const handleCoverArtClick = () => {
    if (!previewUrl) {
      toast.error("No preview available for this beat");
      return;
    }

    if (isCurrentlyPlaying) {
      pause();
    } else {
      play(previewUrl);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or cover art
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest(".cover-art-clickable")
    ) {
      return;
    }
    navigate({ to: "/beat/$beatId", params: { beatId: beat.id } });
  };

  const handlePurchase = async (
    rightIndex: number,
    price: bigint,
    isFree: boolean,
    rightsType: RightsType,
  ) => {
    setIsPurchasing(true);
    setPurchasingRightIndex(rightIndex);

    try {
      const priceInCents = Number(price);
      const isFreeOrZero = isFree || priceInCents === 0;

      if (isFreeOrZero) {
        // Handle free download or $0 price - record purchase immediately
        const sessionId = `free-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Store free purchase in localStorage
        storeFreePurchase(
          beat.id,
          beat.title,
          beat.artist,
          rightsType,
          sessionId,
          beat.deliveryMethod,
        );

        // Record purchase on backend
        await recordPurchase.mutateAsync({
          beatId: beat.id,
          sessionId,
          isFree: true,
          rightsType: rightsType,
        });

        toast.success(
          "Free download access granted! Check your purchase history to download files.",
        );
        setIsPurchasing(false);
        setPurchasingRightIndex(null);
        return;
      }

      // Preflight check for paid purchases
      if (!canStartPaidCheckout) {
        logCheckoutEvent({
          step: "preflight",
          beatId: beat.id,
          rightsType: rightsType.toString(),
          isStripeConfigured,
          errorMessage: "Stripe not configured",
        });
        toast.error(checkoutUnavailableMessage);
        setIsPurchasing(false);
        setPurchasingRightIndex(null);
        return;
      }

      // Handle paid purchase through Stripe
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const rightsLabel = getRightsLabel(rightsType, false);

      logCheckoutEvent({
        step: "createSession",
        beatId: beat.id,
        rightsType: rightsType.toString(),
        isStripeConfigured,
      });

      // Create Stripe checkout session with root-based return URL
      const checkoutSession = await createCheckout.mutateAsync({
        items: [
          {
            productName: `${beat.title} - ${rightsLabel}`,
            productDescription: `${beat.artist} - ${beat.category}`,
            priceInCents: price,
            quantity: BigInt(1),
            currency: "usd",
          },
        ],
        successUrl: `${baseUrl}/?beatId=${beat.id}&rightsType=${rightsType}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/`,
      });

      // Validate checkout URL
      if (!isValidStripeCheckoutUrl(checkoutSession.url)) {
        logCheckoutEvent({
          step: "validateUrl",
          beatId: beat.id,
          rightsType: rightsType.toString(),
          isStripeConfigured,
          hasCheckoutUrl: !!checkoutSession.url,
          errorMessage: "Invalid or empty checkout URL",
        });
        throw new Error("Unable to create checkout session. Please try again.");
      }

      logCheckoutEvent({
        step: "redirect",
        beatId: beat.id,
        rightsType: rightsType.toString(),
        isStripeConfigured,
        hasCheckoutUrl: true,
      });

      // Store pending purchase record (not finalized yet)
      createPendingPaidPurchase(
        beat.id,
        beat.title,
        beat.artist,
        rightsType,
        beat.deliveryMethod,
      );

      // Redirect to Stripe checkout (do NOT call recordBeatPurchase yet)
      window.location.href = checkoutSession.url;
    } catch (error: any) {
      const sanitizedError = sanitizeCheckoutError(error);
      logCheckoutEvent({
        step: "error",
        beatId: beat.id,
        rightsType: rightsType.toString(),
        isStripeConfigured,
        errorMessage: sanitizeErrorForLogging(error),
      });
      toast.error(sanitizedError);
      setIsPurchasing(false);
      setPurchasingRightIndex(null);
    }
  };

  const getRightsVariant = (rightsType: RightsType) => {
    // Basic Right uses default variant which will be styled with purple
    switch (rightsType) {
      case RightsType.basicRight:
        return "default";
      case RightsType.premiumRight:
        return "secondary";
      case RightsType.exclusiveRight:
        return "outline";
      case RightsType.stems:
        return "outline";
      default:
        return "default";
    }
  };

  const getPriceDisplay = (folder: (typeof beat.rightsFolders)[0]) => {
    const priceInCents = Number(folder.priceInCents);
    if (folder.freeDownload || priceInCents === 0) {
      return "Free";
    }
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  return (
    <Card
      className={`overflow-hidden bg-card border-border/40 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer ${
        isCurrentlyPlaying
          ? "ring-2 ring-primary shadow-xl shadow-primary/50 border-primary/60"
          : ""
      }`}
      onClick={handleCardClick}
    >
      <CardHeader className="p-0">
        <button
          type="button"
          className={`cover-art-clickable relative aspect-square overflow-hidden cursor-pointer group w-full ${
            isCurrentlyPlaying
              ? "ring-2 ring-primary shadow-lg shadow-primary/50"
              : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleCoverArtClick();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              handleCoverArtClick();
            }
          }}
        >
          {coverArtUrl ? (
            <img
              src={coverArtUrl}
              alt={beat.title}
              className={`w-full h-full object-cover transition-all duration-300 ${
                isCurrentlyPlaying ? "scale-105" : "group-hover:scale-105"
              }`}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="text-4xl font-bold text-muted-foreground">
                {beat.title[0]}
              </span>
            </div>
          )}

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

          {previewUrl && (
            <div className="absolute bottom-2 left-2 z-10">
              <Badge variant="secondary" className="bg-background/80 text-xs">
                {isVideo ? "Video Audio" : "60s Preview"}
              </Badge>
            </div>
          )}
        </button>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">{beat.title}</h3>
        <p className="text-sm text-muted-foreground mb-2">{beat.artist}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary" className="text-xs">
            {beat.category}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {beat.style}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {beat.texture}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        {isExclusiveSold && (
          <div className="w-full px-4 py-3 rounded-md bg-destructive/10 border border-destructive/40 text-center">
            <span className="text-sm font-semibold text-destructive">
              Exclusive – Sold
            </span>
          </div>
        )}
        {!isExclusiveSold &&
          beat.rightsFolders.map((folder, index) => {
            const priceInCents = Number(folder.priceInCents);
            const isFreeOrZero = folder.freeDownload || priceInCents === 0;
            const isBasicRight = folder.rightsType === RightsType.basicRight;
            const canPurchase = canPurchaseRights(beat, folder.rightsType);
            const isPaidRight = !isFreeOrZero;

            return (
              <Button
                key={String(folder.rightsType)}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePurchase(
                    index,
                    folder.priceInCents,
                    folder.freeDownload,
                    folder.rightsType,
                  );
                }}
                disabled={
                  isPurchasing ||
                  !canPurchase ||
                  (isPaidRight && !canStartPaidCheckout)
                }
                className={`w-full ${isBasicRight ? "bg-[#a970ff] hover:bg-[#a970ff]/90 text-white" : ""}`}
                variant={
                  isBasicRight
                    ? undefined
                    : (getRightsVariant(folder.rightsType) as any)
                }
              >
                {isPurchasing && purchasingRightIndex === index ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : isFreeOrZero ? (
                  <Download className="h-4 w-4 mr-2" />
                ) : (
                  <ShoppingCart className="h-4 w-4 mr-2" />
                )}
                {getRightsLabel(folder.rightsType)} - {getPriceDisplay(folder)}
              </Button>
            );
          })}
      </CardFooter>
    </Card>
  );
}
