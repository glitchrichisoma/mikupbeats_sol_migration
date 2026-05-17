// Centralized purchase tracking utilities for localStorage management

export interface PendingPurchase {
  beatId: string;
  beatTitle: string;
  artist: string;
  rightsType: string;
  timestamp: number;
  deliveryMethod: string;
  pending: true;
}

export interface CompletedPurchase {
  beatId: string;
  beatTitle: string;
  artist: string;
  rightsType: string;
  sessionId: string;
  timestamp: number;
  isFree: boolean;
  deliveryMethod: string;
  pending: false;
}

export type PurchaseRecord = PendingPurchase | CompletedPurchase;

/**
 * Create a pending paid purchase record before Stripe redirect
 */
export function createPendingPaidPurchase(
  beatId: string,
  beatTitle: string,
  artist: string,
  rightsType: string,
  deliveryMethod: string,
): void {
  const pendingPurchase: PendingPurchase = {
    beatId,
    beatTitle,
    artist,
    rightsType,
    timestamp: Date.now(),
    deliveryMethod,
    pending: true,
  };

  const existing = JSON.parse(localStorage.getItem("paidPurchases") || "[]");
  existing.push(pendingPurchase);
  localStorage.setItem("paidPurchases", JSON.stringify(existing));
}

/**
 * Finalize a pending purchase with the real Stripe session ID
 */
export function finalizePaidPurchase(
  beatId: string,
  rightsType: string,
  sessionId: string,
): void {
  const existing: PurchaseRecord[] = JSON.parse(
    localStorage.getItem("paidPurchases") || "[]",
  );

  // Remove any pending or fake session entries for this beat+rightsType
  const filtered = existing.filter(
    (p) => !(p.beatId === beatId && p.rightsType === rightsType),
  );

  // Find the original pending entry to preserve metadata
  const original = existing.find(
    (p) => p.beatId === beatId && p.rightsType === rightsType,
  );

  // Add the finalized purchase with real session ID
  const finalized: CompletedPurchase = {
    beatId,
    beatTitle: original?.beatTitle || "",
    artist: original?.artist || "",
    rightsType,
    sessionId,
    timestamp: Date.now(),
    isFree: false,
    deliveryMethod: original?.deliveryMethod || "zipFiles",
    pending: false,
  };

  filtered.push(finalized);
  localStorage.setItem("paidPurchases", JSON.stringify(filtered));
}

/**
 * Get all completed (non-pending) paid purchases
 */
export function getCompletedPaidPurchases(): CompletedPurchase[] {
  const all: PurchaseRecord[] = JSON.parse(
    localStorage.getItem("paidPurchases") || "[]",
  );
  return all.filter((p): p is CompletedPurchase => !p.pending);
}

/**
 * Store a free purchase (these are always completed immediately)
 */
export function storeFreePurchase(
  beatId: string,
  beatTitle: string,
  artist: string,
  rightsType: string,
  sessionId: string,
  deliveryMethod: string,
): void {
  const purchase: CompletedPurchase = {
    beatId,
    beatTitle,
    artist,
    rightsType,
    sessionId,
    timestamp: Date.now(),
    isFree: true,
    deliveryMethod,
    pending: false,
  };

  const existing = JSON.parse(localStorage.getItem("freePurchases") || "[]");
  existing.push(purchase);
  localStorage.setItem("freePurchases", JSON.stringify(existing));
}
