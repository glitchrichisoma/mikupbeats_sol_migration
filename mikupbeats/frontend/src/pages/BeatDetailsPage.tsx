import { TokenDiscountPanel } from "@/components/TokenDiscountPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Coins,
  Download,
  Loader2,
  Pause,
  Play,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Beat, PreviewType, type RightsFolder, RightsType } from "../backend";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import {
  useCreateCheckoutSession,
  useGetBeat,
  useRecordBeatPurchase,
  useUserWallet,
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
import {
  createPendingPaidPurchase,
  storeFreePurchase,
} from "../utils/purchaseTracking";

const EXCLUSIVE_RIGHTS_DESCRIPTION =
  "Exclusive Rights grants you sole and exclusive usage rights to this beat. Includes unlimited commercial use, unrestricted distribution, remix and sampling rights, and stems at no additional cost. The Licensor retains original copyright documentation.";

export default function BeatDetailsPage() {
  const { beatId } = useParams({ from: "/beat/$beatId" });
  const navigate = useNavigate();
  const { data: beat, isLoading } = useGetBeat(beatId);
  const { currentAudio, isPlaying, play, pause } = useAudioPlayer();
  const createCheckout = useCreateCheckoutSession();
  const recordPurchase = useRecordBeatPurchase();
  const { data: wallet } = useUserWallet();
  const {
    isStripeConfigured,
    canStartPaidCheckout,
    checkoutUnavailableMessage,
  } = useStripePreflight();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchasingRightIndex, setPurchasingRightIndex] = useState<
    number | null
  >(null);
  // Track which right's token panel is open (null = none)
  const [tokenPanelIndex, setTokenPanelIndex] = useState<number | null>(null);
  // Track applied discounts per right index: cents discounted
  const [appliedDiscounts, setAppliedDiscounts] = useState<
    Record<number, number>
  >({});

  const previewUrl = beat?.preview?.reference.getDirectURL();
  const isVideo = beat?.preview?.previewType === PreviewType.video;
  const isCurrentlyPlaying = currentAudio === previewUrl && isPlaying;
  const isExclusiveSold = beat ? isBeatExclusiveSold(beat) : false;
  const walletBalance = wallet?.balance ?? 0n;

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

  const handlePlayPause = () => {
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

  const handleDiscountApplied = (rightIndex: number, usdDiscount: number) => {
    const discountCents = Math.round(usdDiscount * 100);
    setAppliedDiscounts((prev) => ({
      ...prev,
      [rightIndex]: (prev[rightIndex] ?? 0) + discountCents,
    }));
    setTokenPanelIndex(null);
  };

  const handlePurchase = async (
    rightIndex: number,
    price: bigint,
    isFree: boolean,
    rightsType: RightsType,
  ) => {
    if (!beat) return;

    setIsPurchasing(true);
    setPurchasingRightIndex(rightIndex);

    try {
      const discountApplied = appliedDiscounts[rightIndex] ?? 0;
      const priceInCents = Number(price);
      const effectivePrice = BigInt(
        Math.max(0, priceInCents - discountApplied),
      );
      const isFreeOrZero = isFree || effectivePrice === 0n;

      if (isFreeOrZero) {
        const sessionId = `free-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        storeFreePurchase(
          beat.id,
          beat.title,
          beat.artist,
          rightsType,
          sessionId,
          beat.deliveryMethod,
        );

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

      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const rightsLabel = getRightsLabel(rightsType, false);

      logCheckoutEvent({
        step: "createSession",
        beatId: beat.id,
        rightsType: rightsType.toString(),
        isStripeConfigured,
      });

      const checkoutSession = await createCheckout.mutateAsync({
        items: [
          {
            productName: `${beat.title} - ${rightsLabel}`,
            productDescription: `${beat.artist} - ${beat.category}`,
            priceInCents: effectivePrice,
            quantity: BigInt(1),
            currency: "usd",
          },
        ],
        successUrl: `${baseUrl}/?beatId=${beat.id}&rightsType=${rightsType}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/`,
      });

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

      createPendingPaidPurchase(
        beat.id,
        beat.title,
        beat.artist,
        rightsType,
        beat.deliveryMethod,
      );

      window.location.href = checkoutSession.url;
    } catch (error: unknown) {
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

  const getPriceDisplay = (folder: RightsFolder, rightIndex: number) => {
    const priceInCents = Number(folder.priceInCents);
    const discount = appliedDiscounts[rightIndex] ?? 0;
    const effective = Math.max(0, priceInCents - discount);
    if (folder.freeDownload || effective === 0) {
      return "Free";
    }
    if (discount > 0) {
      return (
        <span className="flex flex-col items-end">
          <span className="line-through text-muted-foreground text-sm">
            ${(priceInCents / 100).toFixed(2)}
          </span>
          <span className="text-green-400">
            ${(effective / 100).toFixed(2)}
          </span>
        </span>
      );
    }
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!beat) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Beat not found</p>
            <Button onClick={() => navigate({ to: "/" })}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const coverArtUrl = beat.coverArt[0]?.reference.getDirectURL();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/" })}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Store
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cover Art and Preview */}
          <div className="space-y-4">
            <button
              type="button"
              className={`relative aspect-square overflow-hidden rounded-lg cursor-pointer group w-full ${
                isCurrentlyPlaying
                  ? "ring-4 ring-primary shadow-2xl shadow-primary/50"
                  : ""
              }`}
              onClick={handlePlayPause}
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
                  <span className="text-6xl font-bold text-muted-foreground">
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
                  className={`rounded-full bg-primary/90 p-6 transition-all duration-300 ${
                    isCurrentlyPlaying
                      ? "animate-pulse shadow-2xl shadow-primary/50"
                      : ""
                  }`}
                >
                  {isCurrentlyPlaying ? (
                    <Pause className="h-12 w-12 text-primary-foreground" />
                  ) : (
                    <Play className="h-12 w-12 text-primary-foreground" />
                  )}
                </div>
              </div>

              {previewUrl && (
                <div className="absolute bottom-4 left-4 z-10">
                  <Badge variant="secondary" className="bg-background/80">
                    {isVideo ? "Video Audio" : "60s Preview"}
                  </Badge>
                </div>
              )}
            </button>
          </div>

          {/* Beat Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-[#a970ff]">
                {beat.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-4">
                {beat.artist}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{beat.category}</Badge>
                <Badge variant="secondary">{beat.style}</Badge>
                <Badge variant="secondary">{beat.texture}</Badge>
              </div>
            </div>

            <Card className="bg-card border-border/40">
              <CardHeader>
                <CardTitle className="text-[#a970ff]">
                  Available Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isExclusiveSold && (
                  <div className="w-full px-4 py-3 rounded-md bg-destructive/10 border border-destructive/40 text-center mb-4">
                    <span className="text-sm font-semibold text-destructive">
                      Exclusive – Sold
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      This beat has been sold exclusively and is no longer
                      available for purchase.
                    </p>
                  </div>
                )}
                {!isExclusiveSold &&
                  beat.rightsFolders.map((folder, index) => {
                    const priceInCents = Number(folder.priceInCents);
                    const discountApplied = appliedDiscounts[index] ?? 0;
                    const effectivePriceCents = Math.max(
                      0,
                      priceInCents - discountApplied,
                    );
                    const isFreeOrZero =
                      folder.freeDownload || effectivePriceCents === 0;
                    const canPurchase = canPurchaseRights(
                      beat,
                      folder.rightsType,
                    );
                    const isPaidRight = !(
                      folder.freeDownload || priceInCents === 0
                    );
                    const hasWalletTokens = walletBalance > 0n;
                    const showTokenButton =
                      isPaidRight &&
                      hasWalletTokens &&
                      !discountApplied &&
                      wallet;

                    return (
                      <div
                        key={getRightsLabel(folder.rightsType)}
                        className="p-4 rounded-lg bg-muted/30 border border-border/40 space-y-3"
                        data-ocid={`beat.rights.item.${index + 1}`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">
                            {getRightsLabel(folder.rightsType)}
                          </h3>
                          <span className="text-2xl font-bold text-primary">
                            {getPriceDisplay(folder, index)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {folder.rightsType === RightsType.basicRight &&
                            "Non-Exclusive: You may use this beat, but others can purchase it too. Perfect for demos and mixtapes."}
                          {folder.rightsType === RightsType.premiumRight &&
                            "Non-Exclusive: Enhanced rights with more distribution options. Others can still purchase this beat."}
                          {folder.rightsType === RightsType.exclusiveRight &&
                            EXCLUSIVE_RIGHTS_DESCRIPTION}
                          {folder.rightsType === RightsType.stems &&
                            "Individual track stems for complete creative control."}
                        </p>

                        {/* Token Discount Panel */}
                        {tokenPanelIndex === index && (
                          <TokenDiscountPanel
                            useCase="beatDiscount"
                            beatId={beat.id}
                            priceInCents={Number(folder.priceInCents)}
                            rightsType={folder.rightsType}
                            onDiscountApplied={(usdDiscount) =>
                              handleDiscountApplied(index, usdDiscount)
                            }
                          />
                        )}

                        {/* Discount applied badge */}
                        {discountApplied > 0 && (
                          <div className="flex items-center gap-2 text-xs text-green-400">
                            <Coins className="h-3 w-3" />
                            <span>
                              MIK97 discount applied: −$
                              {(discountApplied / 100).toFixed(2)}
                            </span>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {/* MIK97 token button — only for paid rights with wallet balance */}
                          {showTokenButton && tokenPanelIndex !== index && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTokenPanelIndex(index)}
                              className="border-[#a970ff]/40 text-[#a970ff] hover:bg-[#a970ff]/10 flex-shrink-0"
                              data-ocid={`beat.use_tokens_button.${index + 1}`}
                            >
                              <Coins className="h-3 w-3 mr-1" />
                              Use MIK97
                            </Button>
                          )}

                          <Button
                            onClick={() =>
                              handlePurchase(
                                index,
                                folder.priceInCents,
                                folder.freeDownload,
                                folder.rightsType,
                              )
                            }
                            disabled={
                              isPurchasing ||
                              !canPurchase ||
                              (isPaidRight &&
                                !isFreeOrZero &&
                                !canStartPaidCheckout)
                            }
                            className="flex-1 bg-[#a970ff] hover:bg-[#a970ff]/90"
                            data-ocid={`beat.purchase_button.${index + 1}`}
                          >
                            {isPurchasing && purchasingRightIndex === index ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : isFreeOrZero ? (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                Get Free Download
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Purchase Now
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>

            <Card className="bg-card border-border/40">
              <CardHeader>
                <CardTitle className="text-[#a970ff]">
                  Licensing Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Non-Exclusive Rights:</strong> You receive a license
                  to use the beat, but the producer retains ownership and can
                  sell it to others.
                </p>
                <p>
                  <strong>Exclusive Rights:</strong>{" "}
                  {EXCLUSIVE_RIGHTS_DESCRIPTION}
                </p>
                <p className="text-xs mt-4 pt-4 border-t border-border/40">
                  All purchases include a license agreement. By purchasing, you
                  agree to the terms of use for the selected rights type.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
