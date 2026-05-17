/**
 * Stripe checkout URL validation and error sanitization utilities
 */

/**
 * Validates a Stripe checkout URL
 * @param url - The URL to validate
 * @returns true if valid, false otherwise
 */
export function isValidStripeCheckoutUrl(
  url: string | null | undefined,
): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  const trimmed = url.trim();

  if (trimmed === "") {
    return false;
  }

  // Must be HTTPS
  if (!trimmed.startsWith("https://")) {
    return false;
  }

  // Should be a Stripe checkout URL
  if (!trimmed.includes("checkout.stripe.com")) {
    return false;
  }

  return true;
}

/**
 * Sanitizes error messages for user display
 * Removes sensitive information while keeping useful context
 */
export function sanitizeCheckoutError(error: any): string {
  if (!error) {
    return "An unknown error occurred";
  }

  const message = error.message || String(error);

  // Remove any potential sensitive data patterns
  const sanitized = message
    .replace(/sk_[a-zA-Z0-9_]+/g, "[REDACTED]")
    .replace(/pk_[a-zA-Z0-9_]+/g, "[REDACTED]")
    .replace(/Bearer\s+[^\s]+/g, "Bearer [REDACTED]");

  return sanitized;
}

/**
 * User-friendly error messages for common checkout failures
 */
export const CHECKOUT_ERROR_MESSAGES = {
  STRIPE_NOT_CONFIGURED:
    "Checkout is currently unavailable. Please try again later.",
  INVALID_URL: "Unable to create checkout session. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  UNKNOWN: "Failed to process checkout. Please try again.",
} as const;
