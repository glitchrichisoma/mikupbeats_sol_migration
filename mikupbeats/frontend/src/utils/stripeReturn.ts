// Utility for handling Stripe return flow across login

export interface StripeReturnParams {
  beatId: string;
  rightsType: string;
  sessionId: string;
}

const STORAGE_KEY = "pendingStripeReturn";

/**
 * Detect if current URL has Stripe return params
 */
export function detectStripeReturnParams(): StripeReturnParams | null {
  const urlParams = new URLSearchParams(window.location.search);
  const beatId = urlParams.get("beatId");
  const rightsType = urlParams.get("rightsType");
  const sessionId = urlParams.get("session_id");

  if (beatId && rightsType && sessionId) {
    return { beatId, rightsType, sessionId };
  }

  return null;
}

/**
 * Persist Stripe return params to sessionStorage
 */
export function persistStripeReturnParams(params: StripeReturnParams): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(params));
}

/**
 * Retrieve persisted Stripe return params from sessionStorage
 */
export function getPersistedStripeReturnParams(): StripeReturnParams | null {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as StripeReturnParams;
  } catch {
    return null;
  }
}

/**
 * Clear persisted Stripe return params from sessionStorage
 */
export function clearPersistedStripeReturnParams(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

/**
 * Build purchase history URL with Stripe return params
 */
export function buildPurchaseHistoryUrl(params: StripeReturnParams): string {
  const searchParams = new URLSearchParams({
    beatId: params.beatId,
    rightsType: params.rightsType,
    session_id: params.sessionId,
  });
  return `/purchase-history?${searchParams.toString()}`;
}
