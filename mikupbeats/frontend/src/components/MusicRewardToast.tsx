import { useEffect, useState } from "react";

type ToastType = "earned" | "cap_reached" | "cooldown";

interface MusicRewardToastProps {
  amount: number;
  type: ToastType;
  cooldownDays?: number;
  contentLabel?: string;
}

interface ToastItem {
  id: number;
  amount: number;
  type: ToastType;
  cooldownDays?: number;
  contentLabel?: string;
}

let toastIdCounter = 0;
let externalAddToast: ((props: MusicRewardToastProps) => void) | null = null;

export function showMusicRewardToast(props: MusicRewardToastProps) {
  if (externalAddToast) {
    externalAddToast(props);
  }
}

export function MusicRewardToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    externalAddToast = (props: MusicRewardToastProps) => {
      const id = ++toastIdCounter;
      setToasts((prev) => [...prev, { id, ...props }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    return () => {
      externalAddToast = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border shadow-lg text-sm font-medium animate-in slide-in-from-right-2 fade-in duration-200"
          style={{
            borderColor:
              toast.type === "earned"
                ? "rgba(168,85,247,0.4)"
                : "rgba(100,100,120,0.3)",
            boxShadow:
              toast.type === "earned"
                ? "0 4px 12px rgba(168,85,247,0.2)"
                : "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {toast.type === "earned" ? (
            <>
              <span className="text-primary font-bold text-base">⚡</span>
              <span className="text-foreground">
                +{toast.amount} MIK97 earned
              </span>
            </>
          ) : toast.type === "cooldown" ? (
            <>
              <span className="text-muted-foreground text-base">⏳</span>
              <span className="text-muted-foreground">
                {toast.cooldownDays && toast.cooldownDays > 0
                  ? `Cooldown: ${toast.cooldownDays} day${toast.cooldownDays !== 1 ? "s" : ""} remaining`
                  : toast.contentLabel
                    ? `Already earned from this ${toast.contentLabel} — cooldown active`
                    : "Already earned — cooldown active"}
              </span>
            </>
          ) : (
            <>
              <span className="text-muted-foreground text-base">🎵</span>
              <span className="text-muted-foreground">
                Daily music limit reached
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
