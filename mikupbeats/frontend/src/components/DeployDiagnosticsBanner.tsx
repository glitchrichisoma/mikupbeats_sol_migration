import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatBuildMetadata, getBuildMetadata } from "@/lib/buildMeta";
import { Info, X } from "lucide-react";
import { useState } from "react";

/**
 * Deployment diagnostics banner
 * Displays build metadata and troubleshooting hints
 */
export default function DeployDiagnosticsBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const metadata = getBuildMetadata();
  const isDevelopment = metadata.environment === "development";

  // Only show in development or if explicitly enabled
  const shouldShow =
    isDevelopment || localStorage.getItem("showDeployDiagnostics") === "true";

  if (!shouldShow || !isVisible) {
    return null;
  }

  return (
    <Alert className="fixed bottom-24 right-4 z-50 max-w-md border-primary/20 bg-card/95 backdrop-blur-sm shadow-lg">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-primary mt-0.5" />
        <div className="flex-1 space-y-2">
          <AlertDescription className="text-sm">
            <div className="font-semibold text-foreground mb-1">
              Deployment Info
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>
                Environment:{" "}
                <span className="text-foreground">{metadata.environment}</span>
              </div>
              <div>
                Version:{" "}
                <span className="text-foreground">{metadata.version}</span>
              </div>
              {metadata.buildTime !== "unknown" && (
                <div>
                  Build:{" "}
                  <span className="text-foreground">{metadata.buildTime}</span>
                </div>
              )}
              {metadata.canisterId && (
                <div>
                  Canister:{" "}
                  <span className="text-foreground font-mono text-[10px]">
                    {metadata.canisterId}
                  </span>
                </div>
              )}
            </div>

            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">
                  Troubleshooting:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>
                    Hard refresh: Ctrl+Shift+R (Win/Linux) or Cmd+Shift+R (Mac)
                  </li>
                  <li>Check browser console (F12) for errors</li>
                  <li>See DEPLOYMENT_DEBUGGING.md for full guide</li>
                </ul>
                <p className="mt-2">
                  If deployment appears stale, clear browser cache and hard
                  refresh.
                </p>
              </div>
            )}
          </AlertDescription>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Show Less" : "Troubleshooting Tips"}
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setIsVisible(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
