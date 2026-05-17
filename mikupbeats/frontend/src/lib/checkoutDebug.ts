/**
 * Structured console logging for checkout debugging
 * Never logs secrets or sensitive configuration
 */

export interface CheckoutDebugInfo {
  scope: "beat-checkout";
  step: "preflight" | "createSession" | "validateUrl" | "redirect" | "error";
  beatId: string;
  rightsType: string;
  isStripeConfigured?: boolean;
  hasCheckoutUrl?: boolean;
  errorMessage?: string;
  timestamp: string;
}

/**
 * Logs a structured checkout event to the console
 * Safe for production - no secrets logged
 */
export function logCheckoutEvent(
  info: Omit<CheckoutDebugInfo, "scope" | "timestamp">,
): void {
  const logEntry: CheckoutDebugInfo = {
    scope: "beat-checkout",
    timestamp: new Date().toISOString(),
    ...info,
  };

  // Use console.warn for errors, console.log for info
  if (info.step === "error") {
    console.warn("[Checkout Debug]", logEntry);
  } else {
    console.log("[Checkout Debug]", logEntry);
  }
}

/**
 * Sanitizes error messages before logging
 * Removes any potential secrets or sensitive data
 */
export function sanitizeErrorForLogging(error: any): string {
  if (!error) {
    return "Unknown error";
  }

  const message = error.message || String(error);

  // Remove sensitive patterns
  return message
    .replace(/sk_[a-zA-Z0-9_]+/g, "[KEY]")
    .replace(/pk_[a-zA-Z0-9_]+/g, "[KEY]")
    .replace(/Bearer\s+[^\s]+/g, "Bearer [TOKEN]")
    .replace(/secret[^:]*:\s*[^\s,}]+/gi, "secret: [REDACTED]");
}
