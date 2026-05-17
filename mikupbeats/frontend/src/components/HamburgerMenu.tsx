import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  Coins,
  Gamepad2,
  Headphones,
  Layers,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Music,
  Radio,
  ShoppingBag,
  Star,
  Store,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetPlatformToggles } from "../hooks/useQueries";

export default function HamburgerMenu({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: platformToggles } = useGetPlatformToggles();

  const isAuthenticated = !!identity;

  const gamesMode = platformToggles?.gamesMode ?? "live";
  const walletMode = platformToggles?.walletMode ?? "live";
  // Admin always sees all nav items
  const showGames = isAdmin || gamesMode !== "hidden";
  const showWallet = isAdmin || walletMode !== "hidden";
  const showLedger = isAdmin || (platformToggles?.showPublicLedger ?? false);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    setOpen(false);
    window.location.href = "/";
  };

  const handleLogin = async () => {
    setOpen(false);
    try {
      await login();
    } catch (error: unknown) {
      console.error("Login error:", error);
    }
  };

  const handleNavigation = (path: string) => {
    navigate({ to: path });
    setOpen(false);
    // Always scroll to top when navigating to a new page from the hamburger menu.
    // Use setTimeout to allow the Sheet close animation to begin first.
    setTimeout(
      () => window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }),
      0,
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 h-10 w-10 rounded-full bg-card border border-primary/20 hover:bg-primary/10 shadow-lg shadow-primary/10"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[280px] sm:w-[320px] bg-card border-primary/20 flex flex-col p-0"
      >
        {/* Header — fixed at top, not scrollable */}
        <div className="px-6 pt-6 pb-2 shrink-0">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <img
                src="/assets/generated/mikupbeats-logo-transparent.dim_200x200.png"
                alt="MikupBeats"
                className="h-8 w-8"
              />
              <span className="text-primary">MikupBeats</span>
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* Scrollable content area — all nav + account + footer */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="mt-6 space-y-6">
            {/* Navigation */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                Navigation
              </p>
              <nav className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-11"
                  onClick={() => handleNavigation("/")}
                >
                  <Store className="h-5 w-5" />
                  <span>Store</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-11"
                  onClick={() => handleNavigation("/showcase")}
                >
                  <Star className="h-5 w-5" />
                  <span>Showcase</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-11"
                  onClick={() => handleNavigation("/live")}
                >
                  <Radio className="h-5 w-5" />
                  <span>Live</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-11"
                  onClick={() => handleNavigation("/mva")}
                >
                  <Layers className="h-5 w-5" />
                  <span>M.v.A</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-11"
                  onClick={() => handleNavigation("/music-links")}
                >
                  <Music className="h-5 w-5" />
                  <span>Music Links</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-11"
                  onClick={() => handleNavigation("/forum")}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Community Forum</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-11"
                  onClick={() => handleNavigation("/listen-rooms")}
                  data-ocid="hamburger.listen_rooms_link"
                >
                  <Headphones className="h-5 w-5" />
                  <span>Listen Rooms</span>
                </Button>
                {showGames && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-11"
                    onClick={() => handleNavigation("/games")}
                    data-ocid="hamburger.games_link"
                  >
                    <Gamepad2 className="h-5 w-5" />
                    <span>Games</span>
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-11"
                    onClick={() => handleNavigation("/admin")}
                    data-ocid="hamburger.admin_link"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Admin Panel</span>
                  </Button>
                )}
                {showLedger && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-11"
                    onClick={() => handleNavigation("/ledger")}
                    data-ocid="hamburger.ledger_link"
                  >
                    <BookOpen className="h-5 w-5" />
                    <span>Tx Ledger</span>
                  </Button>
                )}
              </nav>
            </div>

            <Separator />

            {/* Account section */}
            {isAuthenticated ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                  Account
                </p>
                <nav className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-11"
                    onClick={() => handleNavigation("/account-setup")}
                  >
                    <User className="h-5 w-5" />
                    <span>Account Setup</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-11"
                    onClick={() => handleNavigation("/purchase-history")}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    <span>Purchase History</span>
                  </Button>
                  {showWallet && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-11"
                      onClick={() => handleNavigation("/wallet")}
                      data-ocid="hamburger.wallet_link"
                    >
                      <Coins className="h-5 w-5" />
                      <span>MIK97 Wallet</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    data-ocid="hamburger.logout_button"
                    className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </Button>
                </nav>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                  Account
                </p>
                <nav className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-11"
                    onClick={handleLogin}
                    disabled={loginStatus === "logging-in"}
                  >
                    <LogIn className="h-5 w-5" />
                    <span>
                      {loginStatus === "logging-in" ? "Logging in..." : "Login"}
                    </span>
                  </Button>
                </nav>
              </div>
            )}

            <Separator />

            {/* Branding footer — inside the scroll container so it's always reachable */}
            <div className="text-xs text-muted-foreground text-center pb-2">
              <p>© {new Date().getFullYear()} MikupBeats</p>
              <p className="mt-1">
                Built with love using{" "}
                <a
                  href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  caffeine.ai
                </a>
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
