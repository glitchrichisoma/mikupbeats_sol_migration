/**
 * Formats a MIK97 token amount for display.
 * Backend stores ALL token values as plain numbers (no ×1e8 factor).
 * Pass the value directly — no division needed.
 *
 * Examples:
 *   formatMIK97(50)      → "50"
 *   formatMIK97(0.5)     → "0.5"
 *   formatMIK97(0.25)    → "0.25"
 *   formatMIK97(2.8)     → "2.8"
 *   formatMIK97(0)       → "0"
 *   formatMIK97(1250.5)  → "1,250.5"
 */
export function formatMIK97(value: number): string {
  if (!Number.isFinite(value) || Number.isNaN(value)) return "0";

  // Convert to fixed-point string to eliminate scientific notation
  // Use toFixed(8) which is safe for up to 8 decimal places, then trim
  const fixed = value.toFixed(8);
  // parseFloat trims trailing zeros: "50.00000000" → 50 → "50"
  const trimmed = Number.parseFloat(fixed);

  // Format with locale for thousands separators on large numbers
  if (Math.abs(trimmed) >= 1000) {
    return trimmed.toLocaleString("en-US", {
      maximumFractionDigits: 8,
      useGrouping: true,
    });
  }

  // For smaller numbers, just return the trimmed string directly (no grouping)
  return trimmed.toString();
}

/**
 * @deprecated Use formatMIK97 instead.
 * Legacy alias kept for backward compatibility.
 */
export function formatTokenAmount(value: number): string {
  return formatMIK97(value);
}

/**
 * @deprecated Do NOT divide by 1e8 — backend stores plain values, not ×1e8.
 * This function is kept only to avoid import errors during migration.
 */
export function formatRawTokenAmount(raw: number): string {
  // raw IS the value — no conversion needed
  return formatMIK97(raw);
}
