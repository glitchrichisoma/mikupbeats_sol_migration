import { type Beat, RightsFolder, RightsType } from "../backend";

/**
 * Licensing text constants for buyer-facing display
 */
export const NON_EXCLUSIVE_BUYER_TEXT =
  "Non-exclusive licenses allow multiple artists to license this beat and stems until exclusive rights are purchased.";

export const LEGAL_CLAUSE_TEXT =
  "Licensor retains the right to license the beat and stem files to third parties until exclusive rights are purchased.";

/**
 * Get display label for rights type with Non-Exclusive designation
 */
export function getRightsLabel(
  rightsType: RightsType,
  includeNonExclusiveLabel = true,
): string {
  const baseLabels: Record<RightsType, string> = {
    [RightsType.basicRight]: "Basic",
    [RightsType.premiumRight]: "Premium",
    [RightsType.exclusiveRight]: "Exclusive",
    [RightsType.stems]: "Stem Pack",
  };

  const label = baseLabels[rightsType] || "Unknown";

  // Only add (Non-Exclusive) for non-exclusive rights
  if (includeNonExclusiveLabel && rightsType !== RightsType.exclusiveRight) {
    return `${label} (Non-Exclusive)`;
  }

  return label;
}

/**
 * Check if a beat is Exclusive-sold (Exclusive rights have been purchased)
 */
export function isBeatExclusiveSold(beat: Beat): boolean {
  const exclusiveFolder = beat.rightsFolders.find(
    (folder) => folder.rightsType === RightsType.exclusiveRight,
  );
  return exclusiveFolder?.sold === true;
}

/**
 * Check if a specific rights type is sold
 * NOTE: For non-exclusive rights (Basic/Premium/Stems), this should always return false
 * Only Exclusive rights can be marked as sold
 */
export function isRightsSold(beat: Beat, rightsType: RightsType): boolean {
  // Non-exclusive rights are never considered sold
  if (rightsType !== RightsType.exclusiveRight) {
    return false;
  }

  // Only check sold status for Exclusive rights
  const folder = beat.rightsFolders.find((f) => f.rightsType === rightsType);
  return folder?.sold === true;
}

/**
 * Check if a rights type can be purchased
 * Non-exclusive rights (Basic/Premium/Stems) can always be purchased unless Exclusive is sold
 * Exclusive rights can only be purchased if not already sold
 */
export function canPurchaseRights(beat: Beat, rightsType: RightsType): boolean {
  // If beat is Exclusive-sold, no rights can be purchased
  if (isBeatExclusiveSold(beat)) {
    return false;
  }

  // For non-exclusive rights, they can always be purchased (unless Exclusive is sold, checked above)
  if (rightsType !== RightsType.exclusiveRight) {
    return true;
  }

  // For Exclusive rights, check if it's already sold
  return !isRightsSold(beat, rightsType);
}

/**
 * Get availability message for a beat
 */
export function getBeatAvailabilityMessage(beat: Beat): string | null {
  if (isBeatExclusiveSold(beat)) {
    return "This beat has been exclusively licensed and is no longer available for purchase.";
  }
  return null;
}
