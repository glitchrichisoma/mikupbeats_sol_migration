/**
 * Build metadata utility
 * Exposes build-time and runtime metadata to help verify deployments
 */

export interface BuildMetadata {
  buildTime: string;
  environment: string;
  version: string;
  canisterId?: string;
}

/**
 * Get build metadata from environment variables and runtime context
 */
export function getBuildMetadata(): BuildMetadata {
  // Try to get build time from environment (set during build if available)
  const buildTime = import.meta.env.VITE_BUILD_TIME || "unknown";

  // Get environment
  const environment = import.meta.env.MODE || "development";

  // Get version from package.json if available
  const version = import.meta.env.VITE_APP_VERSION || "1.0.0";

  // Try to extract canister ID from current URL
  let canisterId: string | undefined;
  try {
    const hostname = window.location.hostname;
    // IC canister URLs typically have format: <canister-id>.ic0.app or <canister-id>.localhost
    const match = hostname.match(
      /^([a-z0-9-]+)\.(ic0\.app|localhost|raw\.ic0\.app)/,
    );
    if (match) {
      canisterId = match[1];
    }
  } catch (_e) {
    // Ignore errors in canister ID extraction
  }

  return {
    buildTime,
    environment,
    version,
    canisterId,
  };
}

/**
 * Format build metadata as a readable string
 */
export function formatBuildMetadata(meta: BuildMetadata): string {
  const parts = [
    `Environment: ${meta.environment}`,
    `Version: ${meta.version}`,
    `Build Time: ${meta.buildTime}`,
  ];

  if (meta.canisterId) {
    parts.push(`Canister ID: ${meta.canisterId}`);
  }

  return parts.join(" | ");
}

/**
 * Log build metadata to console
 */
export function logBuildMetadata(): void {
  const meta = getBuildMetadata();

  console.group("🚀 MikupBeats Deployment Info");
  console.log("Environment:", meta.environment);
  console.log("Version:", meta.version);
  console.log("Build Time:", meta.buildTime);
  if (meta.canisterId) {
    console.log("Canister ID:", meta.canisterId);
  }
  console.log("Timestamp:", new Date().toISOString());
  console.groupEnd();
}
