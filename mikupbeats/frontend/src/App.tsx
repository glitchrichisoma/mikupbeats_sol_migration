import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import DeployDiagnosticsBanner from "./components/DeployDiagnosticsBanner";
import Footer from "./components/Footer";
import HamburgerMenu from "./components/HamburgerMenu";
import Header from "./components/Header";
import { MusicRewardToastContainer } from "./components/MusicRewardToast";
import ProfileSetup from "./components/ProfileSetup";
import QuickLinkBar from "./components/QuickLinkBar";
import ScrollToTop from "./components/ScrollToTop";
import { AudioPlayerProvider } from "./contexts/AudioPlayerContext";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile, useIsCallerAdmin } from "./hooks/useQueries";
import AccountSetupPage from "./pages/AccountSetupPage";
import AdminPage from "./pages/AdminPage";
import BeatDetailsPage from "./pages/BeatDetailsPage";
import DinoJumpFullscreen from "./pages/DinoJumpFullscreen";
import FlappyBirdFullscreen from "./pages/FlappyBirdFullscreen";
import ForumPage from "./pages/ForumPage";
import GamesPage from "./pages/GamesPage";
import LedgerExplorerPage from "./pages/LedgerExplorerPage";
import ListenRoomsPage from "./pages/ListenRoomsPage";
import LivePage from "./pages/LivePage";
import LoginPage from "./pages/LoginPage";
import MixtapesPage from "./pages/MixtapesPage";
import MusicLinksPage from "./pages/MusicLinksPage";
import MvaPage from "./pages/MvaPage";
import PurchaseHistoryPage from "./pages/PurchaseHistoryPage";
import SectionDetailPage from "./pages/SectionDetailPage";
import ShowcasePage from "./pages/ShowcasePage";
import StorePage from "./pages/StorePage";
import WalletPage from "./pages/WalletPage";
import {
  buildPurchaseHistoryUrl,
  clearPersistedStripeReturnParams,
  detectStripeReturnParams,
  getPersistedStripeReturnParams,
  persistStripeReturnParams,
} from "./utils/stripeReturn";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function Layout() {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const { data: isAdmin, isFetched: isAdminFetched } = useIsCallerAdmin();
  const navigate = useNavigate();

  const showAdminButton =
    !!identity &&
    !!actor &&
    !actorFetching &&
    isAdminFetched &&
    isAdmin === true;

  // Handle post-login redirect
  useEffect(() => {
    if (identity) {
      const pendingUrl = localStorage.getItem("pendingRedirectUrl");
      if (pendingUrl) {
        localStorage.removeItem("pendingRedirectUrl");
        navigate({ to: pendingUrl as any });
      }
    }
  }, [identity, navigate]);

  // Handle Stripe return redirect after login
  useEffect(() => {
    if (identity) {
      const stripeParams = getPersistedStripeReturnParams();
      if (stripeParams) {
        // User just logged in and we have pending Stripe return
        const purchaseUrl = buildPurchaseHistoryUrl(stripeParams);
        // Navigate to purchase history with params
        window.location.href = purchaseUrl;
        // Note: clearPersistedStripeReturnParams will be called by PurchaseHistoryPage after processing
      }
    }
  }, [identity]);

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <HamburgerMenu isAdmin={showAdminButton} />
      <Header />
      <main className="flex-1 pb-20 page-enter">
        <Outlet />
      </main>
      <QuickLinkBar isAdmin={showAdminButton} />
      <Footer />
      <DeployDiagnosticsBanner />
    </div>
  );
}

const rootRoute = createRootRoute({
  component: Layout,
});

const storeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: StorePage,
});

const beatDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/beat/$beatId",
  component: BeatDetailsPage,
});

const showcaseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/showcase",
  component: ShowcasePage,
});

const liveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/live",
  component: LivePage,
});

const mvaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/mva",
  component: MvaPage,
});

const musicLinksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/music-links",
  component: MusicLinksPage,
});

const forumRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forum",
  component: ForumPage,
});

const sectionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forum/section/$sectionId",
  component: SectionDetailPage,
});

const mixtapesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/mixtapes",
  component: MixtapesPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const purchaseHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/purchase-history",
  component: PurchaseHistoryPage,
});

const accountSetupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/account-setup",
  component: AccountSetupPage,
});

const walletRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wallet",
  component: WalletPage,
});

const gamesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/games",
  component: GamesPage,
});

const dinoFullscreenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/games/dino",
  component: DinoJumpFullscreen,
});

const flappyFullscreenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/games/flappy",
  component: FlappyBirdFullscreen,
});
const ledgerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ledger",
  component: LedgerExplorerPage,
});

const listenRoomsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/listen-rooms",
  component: ListenRoomsPage,
});

const routeTree = rootRoute.addChildren([
  storeRoute,
  beatDetailsRoute,
  showcaseRoute,
  liveRoute,
  mvaRoute,
  musicLinksRoute,
  forumRoute,
  sectionDetailRoute,
  mixtapesRoute,
  adminRoute,
  purchaseHistoryRoute,
  accountSetupRoute,
  walletRoute,
  gamesRoute,
  dinoFullscreenRoute,
  flappyFullscreenRoute,
  ledgerRoute,
  listenRoomsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function StripeReturnHandler() {
  const { identity } = useInternetIdentity();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Only run on root path
    if (window.location.pathname !== "/") {
      return;
    }

    const stripeParams = detectStripeReturnParams();
    if (!stripeParams) {
      return;
    }

    // Stripe return detected
    setIsRedirecting(true);

    if (identity) {
      // User is authenticated, redirect immediately to purchase history
      const purchaseUrl = buildPurchaseHistoryUrl(stripeParams);
      window.location.href = purchaseUrl;
    } else {
      // User is not authenticated, persist params for after login
      persistStripeReturnParams(stripeParams);
      // LoginPage will show the message
    }
  }, [identity]);

  if (!isRedirecting) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <div className="space-y-2">
          <p className="text-xl font-semibold text-foreground">
            Completing your purchase...
          </p>
          <p className="text-sm text-muted-foreground">
            Please wait while we redirect you
          </p>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading MikupBeats...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <StripeReturnHandler />
        <LoginPage />
      </>
    );
  }

  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <AudioPlayerProvider>
      <RouterProvider router={router} />
      <MusicRewardToastContainer />
      {showProfileSetup && (
        <ProfileSetup
          onComplete={() => {
            // Profile setup completed, the query will refetch automatically
          }}
        />
      )}
    </AudioPlayerProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AppContent />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
