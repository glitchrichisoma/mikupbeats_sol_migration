import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useApplyTokenDiscount,
  useGetBeatTierDiscountConfig,
  useUserWallet,
} from "@/hooks/useQueries";
import type { BeatTierDiscountConfig } from "@/hooks/useQueries";
import { Coins, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RightsType } from "../backend";

// Reference tiers (shown as examples in UI only — actual input is flexible)
const REFERENCE_TIERS: { tokens: number; usdOff: number }[] = [
  { tokens: 500, usdOff: 5 },
  { tokens: 1000, usdOff: 10 },
  { tokens: 3000, usdOff: 30 },
  { tokens: 7000, usdOff: 70 },
];

interface TokenDiscountPanelProps {
  useCase: string;
  beatId?: string;
  /** Current price in cents so the component can show "new total" */
  priceInCents: number;
  /** Called with the USD discount amount (number) after tokens are burned */
  onDiscountApplied: (usdDiscount: number) => void;
  onRemoveDiscount?: () => void;
  appliedDiscountUsd?: number;
  disabled?: boolean;
  /** Which rights tier this panel is for */
  rightsType?: RightsType;
  /** Optional override — if not provided, fetched internally */
  tierDiscountConfig?: BeatTierDiscountConfig;
}

/** Map RightsType to the relevant config fields */
function getTierFlags(
  rt: RightsType | undefined,
  cfg: BeatTierDiscountConfig,
): { enabled: boolean; maxPct: number } {
  switch (rt) {
    case RightsType.basicRight:
      return {
        enabled: cfg.basicDiscountEnabled,
        maxPct: cfg.basicMaxDiscountPercent,
      };
    case RightsType.premiumRight:
      return {
        enabled: cfg.premiumDiscountEnabled,
        maxPct: cfg.premiumMaxDiscountPercent,
      };
    case RightsType.exclusiveRight:
      return {
        enabled: cfg.exclusiveDiscountEnabled,
        maxPct: cfg.exclusiveMaxDiscountPercent,
      };
    case RightsType.stems:
      return {
        enabled: cfg.stemsDiscountEnabled,
        maxPct: cfg.stemsMaxDiscountPercent,
      };
    default:
      return { enabled: true, maxPct: 100 };
  }
}

export function TokenDiscountPanel({
  useCase,
  beatId,
  priceInCents,
  onDiscountApplied,
  onRemoveDiscount,
  appliedDiscountUsd = 0,
  disabled = false,
  rightsType,
  tierDiscountConfig,
}: TokenDiscountPanelProps) {
  const { data: wallet } = useUserWallet();
  const applyDiscount = useApplyTokenDiscount();
  // wallet.balance is already a Float (divided by 1e8) from the backend — keep as number
  const walletBalance: number = wallet != null ? wallet.balance : 0;

  // Fetch tier config internally if not passed via props
  const { data: fetchedTierConfig } = useGetBeatTierDiscountConfig();
  const activeTierConfig = tierDiscountConfig ?? fetchedTierConfig;

  // Determine tier-level constraints
  const tierFlags = activeTierConfig
    ? getTierFlags(rightsType, activeTierConfig)
    : { enabled: true, maxPct: 100 };

  // Max discount in USD based on admin-set % cap
  const tierMaxDiscountUsd =
    priceInCents > 0
      ? (priceInCents / 100) * (tierFlags.maxPct / 100)
      : priceInCents / 100;
  const tierMaxDiscountCents = Math.round(tierMaxDiscountUsd * 100);

  // 100 MIK97 = $1 = 100 cents (float arithmetic throughout)
  const tokensNeededForTierMax = tierMaxDiscountCents;
  const tokensNeededToMakeItFree = priceInCents;

  // Cap: can't spend more than tier cap, can't exceed balance
  const effectiveCap = Math.min(
    tokensNeededForTierMax,
    tokensNeededToMakeItFree,
  );
  const maxTokensAllowed = Math.min(walletBalance, effectiveCap);

  const visibleTiers = REFERENCE_TIERS.filter(
    (t) => t.tokens <= walletBalance && t.tokens <= effectiveCap,
  );

  const [tokenInput, setTokenInput] = useState<string>(() => {
    const best = visibleTiers[visibleTiers.length - 1];
    const defaultTokens = best ? Math.min(best.tokens, maxTokensAllowed) : 0;
    return defaultTokens.toString();
  });

  const parsedInput = Number.parseFloat(tokenInput) || 0;
  const rawInput = Math.max(0, parsedInput);
  const tokensToApply = Math.min(rawInput, maxTokensAllowed);

  const usdSavingsRaw = tokensToApply / 100;
  const maxDiscountUsd = priceInCents / 100;
  const usdSavings = Math.min(
    usdSavingsRaw,
    maxDiscountUsd,
    tierMaxDiscountUsd,
  );
  const newPriceCents = Math.max(
    0,
    priceInCents - Math.round(usdSavings * 100),
  );
  const isFree = newPriceCents === 0 && tokensToApply > 0;

  const tokensActuallyNeeded = Math.min(
    tokensToApply,
    tierMaxDiscountCents,
    priceInCents,
  );
  const tokensKeptInWallet = tokensToApply - tokensActuallyNeeded;

  const canApply =
    !disabled && tokensToApply > 0 && tokensToApply <= walletBalance;

  const handleApply = async () => {
    if (!canApply) return;
    try {
      const result = await applyDiscount.mutateAsync({
        tokensToSpend: tokensToApply,
        useCase,
        beatId,
        priceInCents,
      });
      const burned = result.tokensActuallyBurned;
      const savedUsd = result.discountApplied;
      onDiscountApplied(savedUsd);
      if (tokensKeptInWallet > 0) {
        toast.success(
          `You saved $${savedUsd.toFixed(2)} — ${burned.toLocaleString()} MIK97 burned (${tokensKeptInWallet.toLocaleString()} MIK97 kept in wallet)`,
        );
      } else {
        toast.success(
          `Applied ${burned.toLocaleString()} MIK97 — $${savedUsd.toFixed(2)} discount!`,
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to apply tokens";
      toast.error(msg);
    }
  };

  // If discount already applied
  if (appliedDiscountUsd > 0) {
    return (
      <div
        className="rounded-lg border border-[#a970ff]/40 bg-[#1a1035] p-3 flex items-center justify-between"
        data-ocid="token_discount.applied_panel"
      >
        <div className="flex items-center gap-2 text-sm text-green-400">
          <Coins className="h-4 w-4" />
          <span>MIK97 discount applied: −${appliedDiscountUsd.toFixed(2)}</span>
        </div>
        {onRemoveDiscount && !disabled && (
          <button
            type="button"
            onClick={onRemoveDiscount}
            className="text-muted-foreground hover:text-foreground transition-colors ml-2"
            aria-label="Remove token discount"
            data-ocid="token_discount.remove_button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  // If discount is disabled for this tier
  if (!tierFlags.enabled) {
    return (
      <div
        className="rounded-lg border border-[#a970ff]/20 bg-[#1a1035] p-3 text-center"
        data-ocid="token_discount.disabled_panel"
      >
        <p className="text-xs text-muted-foreground">
          Token discounts are not available for this license type.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-[#a970ff]/40 bg-[#1a1035] p-4 space-y-3"
      data-ocid="token_discount.panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-[#a970ff]" />
          <span className="text-sm font-semibold text-[#a970ff]">
            Apply MIK97 Discount
          </span>
        </div>
        {tierFlags.maxPct < 100 && (
          <span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">
            Max {tierFlags.maxPct.toFixed(0)}% off
          </span>
        )}
      </div>

      {/* Balance */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Your balance:</span>
        <span className="font-mono text-foreground">
          {walletBalance.toLocaleString()} MIK97
        </span>
      </div>

      {walletBalance === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-1">
          You have no MIK97 tokens. Earn them by playing games or listening to
          music.
        </p>
      ) : (
        <>
          {/* Preset tier buttons */}
          {visibleTiers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {visibleTiers.map((tier) => {
                const tierTokens =
                  tier.tokens > effectiveCap ? effectiveCap : tier.tokens;
                const tierSavingsUsd = Math.min(
                  tierTokens / 100,
                  tierMaxDiscountUsd,
                );
                const tierMakesFree =
                  tierTokens >= effectiveCap &&
                  effectiveCap >= tokensNeededToMakeItFree;
                const isSelected = tokenInput === tierTokens.toString();
                return (
                  <button
                    key={tier.tokens.toString()}
                    type="button"
                    onClick={() => setTokenInput(tierTokens.toString())}
                    className={`px-3 py-1 rounded text-xs font-mono border transition-colors ${
                      isSelected
                        ? "border-[#a970ff] bg-[#a970ff]/20 text-[#a970ff]"
                        : "border-border/40 text-muted-foreground hover:border-[#a970ff]/50"
                    }`}
                    data-ocid={`token_discount.preset.${tier.tokens}`}
                  >
                    {tierMakesFree
                      ? `FREE — ${tierTokens.toLocaleString()} tokens`
                      : `${tierTokens.toLocaleString()} MIK97 (−$${tierSavingsUsd.toFixed(0)})`}
                  </button>
                );
              })}
            </div>
          )}

          {/* Custom amount input */}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={maxTokensAllowed}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="bg-background border-input text-sm h-8"
              placeholder={`0.001 – ${maxTokensAllowed.toLocaleString()}`}
              disabled={disabled}
              data-ocid="token_discount.amount_input"
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              MIK97
            </span>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            Enter any amount up to {maxTokensAllowed.toLocaleString()} MIK97.
            Only the exact tokens needed are burned.
            {tierFlags.maxPct < 100 &&
              ` Max ${tierFlags.maxPct.toFixed(0)}% discount applies.`}
          </p>

          {/* Savings preview */}
          {tokensToApply > 0 && !isFree && (
            <div className="flex items-center justify-between text-sm rounded bg-[#a970ff]/10 px-3 py-2">
              <span className="text-muted-foreground">You save:</span>
              <span className="font-bold text-green-400">
                ${usdSavings.toFixed(2)} USD
              </span>
            </div>
          )}

          {/* FREE state */}
          {isFree && (
            <div className="rounded bg-green-500/10 border border-green-500/30 px-3 py-2 space-y-0.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">New total:</span>
                <span className="font-bold text-green-400 text-base">FREE</span>
              </div>
              {tokensKeptInWallet > 0 && (
                <p className="text-xs text-green-400/80">
                  {tokensActuallyNeeded.toLocaleString()} MIK97 burned ·{" "}
                  {tokensKeptInWallet.toLocaleString()} MIK97 stays in wallet
                </p>
              )}
            </div>
          )}

          {/* New total when not free */}
          {tokensToApply > 0 && !isFree && newPriceCents > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">New total:</span>
              <span className="font-bold text-foreground">
                ${(newPriceCents / 100).toFixed(2)}
              </span>
            </div>
          )}

          {rawInput > walletBalance && (
            <p className="text-xs text-destructive text-center">
              Insufficient balance
            </p>
          )}

          {/* Apply button */}
          <Button
            type="button"
            onClick={handleApply}
            disabled={!canApply || applyDiscount.isPending}
            className="w-full bg-[#a970ff] hover:bg-[#a970ff]/90 text-white h-9 text-sm"
            data-ocid="token_discount.apply_button"
          >
            {applyDiscount.isPending ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Applying…
              </>
            ) : isFree ? (
              <>
                <Coins className="h-3 w-3 mr-2" />
                Get it FREE — {tokensActuallyNeeded.toLocaleString()} MIK97
              </>
            ) : (
              <>
                <Coins className="h-3 w-3 mr-2" />
                Apply {tokensToApply.toLocaleString()} MIK97
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}
