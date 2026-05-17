/**
 * PoL Badge display component — shows a tiered Verified Listener badge.
 * Bronze = 1-33%, Silver = 34-66%, Gold = 67-100%
 */
import type { BadgeTier } from "../types/pol";

interface PoLBadgeProps {
  tier: BadgeTier;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const TIER_CONFIG: Record<
  BadgeTier,
  { label: string; color: string; bg: string; border: string; ring: string }
> = {
  bronze: {
    label: "Bronze Listener",
    color: "#CD7F32",
    bg: "bg-[#2a1a0a]",
    border: "border-[#CD7F32]/60",
    ring: "ring-[#CD7F32]/30",
  },
  silver: {
    label: "Silver Listener",
    color: "#C0C0C0",
    bg: "bg-[#1a1a1a]",
    border: "border-[#C0C0C0]/60",
    ring: "ring-[#C0C0C0]/30",
  },
  gold: {
    label: "Gold Listener",
    color: "#FFD700",
    bg: "bg-[#1a1500]",
    border: "border-[#FFD700]/60",
    ring: "ring-[#FFD700]/30",
  },
};

const SIZE_MAP = {
  sm: {
    container: "h-5 w-5 text-[9px]",
    padding: "p-0.5",
    labelSize: "text-xs",
  },
  md: {
    container: "h-7 w-7 text-[11px]",
    padding: "p-1",
    labelSize: "text-sm",
  },
  lg: {
    container: "h-10 w-10 text-sm",
    padding: "p-1.5",
    labelSize: "text-base",
  },
};

export default function PoLBadge({
  tier,
  size = "sm",
  showLabel = false,
}: PoLBadgeProps) {
  const cfg = TIER_CONFIG[tier];
  const sz = SIZE_MAP[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${showLabel ? "" : ""}`}
      title={`${cfg.label} — Verified Listener (PoL)`}
    >
      <span
        className={`inline-flex items-center justify-center rounded-full border ring-1 ${cfg.bg} ${cfg.border} ${cfg.ring} ${sz.container} ${sz.padding} font-black shrink-0`}
        style={{ color: cfg.color, textShadow: `0 0 6px ${cfg.color}55` }}
        aria-label={cfg.label}
      >
        ♪
      </span>
      {showLabel && (
        <span
          className={`font-semibold ${sz.labelSize}`}
          style={{ color: cfg.color }}
        >
          {tier.charAt(0).toUpperCase() + tier.slice(1)}
        </span>
      )}
    </span>
  );
}
