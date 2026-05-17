import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Optional custom fallback label shown in the section header */
  sectionLabel?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Catches render/query errors in any subtree so one failing section
 * never unmounts the whole admin panel.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return { hasError: true, message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Silent logging — never throw upward
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-5 py-4"
          data-ocid="error_boundary.error_state"
        >
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-sm font-semibold">
              {this.props.sectionLabel
                ? `Unable to load ${this.props.sectionLabel}`
                : "Something went wrong loading this section"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground pl-6">
            {this.state.message || "Try refreshing the page."}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="ml-6 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            data-ocid="error_boundary.retry_button"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Inline section error fallback — used when a query returns isError:true.
 * Shows a small non-crashing message inside the section.
 */
export function SectionError({
  label,
  onRetry,
}: {
  label?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3"
      data-ocid="section.error_state"
    >
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
      <span className="text-sm text-muted-foreground flex-1">
        {label ?? "Unable to load this section — try refreshing."}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors shrink-0"
          data-ocid="section.retry_button"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
