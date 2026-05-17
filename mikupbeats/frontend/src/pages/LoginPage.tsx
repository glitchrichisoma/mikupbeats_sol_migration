import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ChevronDown, Loader2, LogIn, ShoppingCart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import DynamicHomeSequence from "../components/DynamicHomeSequence";
import InteractiveTimeline from "../components/InteractiveTimeline";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { getPersistedStripeReturnParams } from "../utils/stripeReturn";

declare global {
  interface Window { google: any; }
}

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const [hasPendingPurchase, setHasPendingPurchase] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasPendingPurchase(!!getPersistedStripeReturnParams());
  }, []);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const init = () => {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: (window as any).handleGoogleCredential,
        auto_select: false,
      });
      window.google?.accounts.id.renderButton(btnRef.current, {
        theme: "filled_black",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: 280,
      });
    };

    if (window.google) {
      init();
    } else {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.onload = init;
      document.head.appendChild(s);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <DynamicHomeSequence />

      <div className="relative z-10 flex-shrink-0 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-4xl w-full text-center space-y-8">
          <div className="space-y-6 animate-fade-in">
            <div className="relative">
              <img
                src="/assets/generated/mikupbeats-logo-transparent.dim_200x200.png"
                alt="MikupBeats Logo"
                className="h-40 w-40 mx-auto drop-shadow-[0_0_30px_rgba(168,85,247,0.6)] animate-pulse-glow"
              />
            </div>
            <div className="space-y-3">
              <h1 className="text-6xl md:text-7xl font-bold text-primary">MikupBeats</h1>
              <p className="text-2xl md:text-3xl text-primary/80 font-semibold tracking-wide">
                Premium Beat Producer Platform
              </p>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Discover premium beats, showcase your work, and connect with the music community.
              </p>
            </div>
            <div className="relative w-full max-w-3xl mx-auto aspect-[3/1] rounded-lg overflow-hidden border-2 border-primary/30 shadow-[0_0_40px_rgba(168,85,247,0.3)] animate-border-glow">
              <img
                src="/assets/generated/beat-hero-banner.dim_1200x400.png"
                alt="Beat Production"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {hasPendingPurchase && (
            <Alert className="max-w-md mx-auto bg-primary/10 border-primary/30 animate-fade-in">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <AlertDescription className="text-foreground">
                Please log in to complete your purchase
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 animate-fade-in-delay">
            {/* Google Sign-In button renders here */}
            <div className="flex justify-center" ref={btnRef} />

            {/* Fallback button if GSI script hasn't loaded */}
            {loginStatus === "logging-in" && (
              <Button disabled size="lg" className="w-full max-w-md mx-auto text-lg h-14 bg-[#a970ff]/50">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
              </Button>
            )}

            {loginStatus === "error" && (
              <p className="text-sm text-destructive">Sign-in failed. Please try again.</p>
            )}

            <p className="text-xs text-muted-foreground">
              Sign in with your Google account • No ICP wallet required
            </p>
          </div>

          <div className="animate-bounce-slow pt-8">
            <ChevronDown className="h-8 w-8 mx-auto text-primary/60" />
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <InteractiveTimeline />
      </div>
    </div>
  );
}
