import { CHECKOUT_ERROR_MESSAGES } from "../lib/stripeCheckout";
import { useIsStripeConfigured } from "./useQueries";

/**
 * Hook for Stripe checkout preflight checks
 * Centralizes Stripe configuration status and provides consistent error messaging
 */
export function useStripePreflight() {
  const { data: isStripeConfigured, isLoading } = useIsStripeConfigured();

  const canStartPaidCheckout = isStripeConfigured === true;

  const checkoutUnavailableMessage =
    CHECKOUT_ERROR_MESSAGES.STRIPE_NOT_CONFIGURED;

  return {
    isStripeConfigured: isStripeConfigured === true,
    isLoading,
    canStartPaidCheckout,
    checkoutUnavailableMessage,
  };
}
