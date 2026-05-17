import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  CreditCard,
  Disc3,
  FileCheck,
  FileText,
  HelpCircle,
  Layers,
  Music,
  Radio,
  Settings,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Vault,
  Youtube,
} from "lucide-react";
import AdminHelpSection from "../components/AdminHelpSection";
import AnalyticsSection from "../components/AnalyticsSection";
import BasicRightsLicenseManagement from "../components/BasicRightsLicenseManagement";
import BeatManagementSection from "../components/BeatManagementSection";
import BeatUploadSection from "../components/BeatUploadSection";
import ErrorBoundary from "../components/ErrorBoundary";
import ExclusiveRightsLicenseManagement from "../components/ExclusiveRightsLicenseManagement";
import FeaturedBeatManagement from "../components/FeaturedBeatManagement";
import LiveShowsManagement from "../components/LiveShowsManagement";
import MilestoneManagement from "../components/MilestoneManagement";
import MixtapeApprovalSection from "../components/MixtapeApprovalSection";
import MixtapeSubmissionFeeConfig from "../components/MixtapeSubmissionFeeConfig";
import MvaPreviewUploadSection from "../components/MvaPreviewUploadSection";
import PremiumRightsLicenseManagement from "../components/PremiumRightsLicenseManagement";
import ShowcaseApprovalSection from "../components/ShowcaseApprovalSection";
import StemsRightsLicenseManagement from "../components/StemsRightsLicenseManagement";
import StripeConfigSection from "../components/StripeConfigSection";
import YouTubeConfigSection from "../components/YouTubeConfigSection";
import AdminTreasuryPanel from "../components/admin/AdminTreasuryPanel";
import Layer1SettingsPanel from "../components/admin/Layer1SettingsPanel";
import Layer2SettingsPanel from "../components/admin/Layer2SettingsPanel";

export default function AdminPage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage beats, showcases, mixtapes, and platform settings
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-17 gap-2 h-auto p-2 bg-card/50 backdrop-blur-sm">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </TabsTrigger>
          <TabsTrigger value="beats" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Beats</span>
          </TabsTrigger>
          <TabsTrigger value="featured" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Featured</span>
          </TabsTrigger>
          <TabsTrigger value="showcases" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Showcases</span>
          </TabsTrigger>
          <TabsTrigger value="mixtapes" className="flex items-center gap-2">
            <Disc3 className="h-4 w-4" />
            <span className="hidden sm:inline">Mixtapes</span>
          </TabsTrigger>
          <TabsTrigger value="youtube" className="flex items-center gap-2">
            <Youtube className="h-4 w-4" />
            <span className="hidden sm:inline">YouTube</span>
          </TabsTrigger>
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Radio className="h-4 w-4" />
            <span className="hidden sm:inline">Live</span>
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="mva" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">M.v.A</span>
          </TabsTrigger>
          <TabsTrigger value="license" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">License</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="stripe" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Stripe</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
          <TabsTrigger value="layer1" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Layer 1</span>
          </TabsTrigger>
          <TabsTrigger value="layer2" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Layer 2</span>
          </TabsTrigger>
          <TabsTrigger value="help" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Help</span>
          </TabsTrigger>
          <TabsTrigger value="treasury" className="flex items-center gap-2">
            <Vault className="h-4 w-4" />
            <span className="hidden sm:inline">Treasury</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          <ErrorBoundary sectionLabel="Upload">
            <BeatUploadSection />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="beats" className="mt-6">
          <ErrorBoundary sectionLabel="Beats">
            <BeatManagementSection />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="featured" className="mt-6">
          <ErrorBoundary sectionLabel="Featured">
            <FeaturedBeatManagement />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="showcases" className="mt-6">
          <ErrorBoundary sectionLabel="Showcases">
            <ShowcaseApprovalSection />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="mixtapes" className="mt-6">
          <ErrorBoundary sectionLabel="Mixtapes">
            <div className="space-y-6">
              <MixtapeSubmissionFeeConfig />
              <MixtapeApprovalSection />
            </div>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="youtube" className="mt-6">
          <ErrorBoundary sectionLabel="YouTube Config">
            <YouTubeConfigSection />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="live" className="mt-6">
          <ErrorBoundary sectionLabel="Live Shows">
            <LiveShowsManagement />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="milestones" className="mt-6">
          <ErrorBoundary sectionLabel="Milestones">
            <MilestoneManagement />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="mva" className="mt-6">
          <ErrorBoundary sectionLabel="M.v.A">
            <MvaPreviewUploadSection />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="license" className="mt-6">
          <ErrorBoundary sectionLabel="License Management">
            <div className="space-y-6">
              <BasicRightsLicenseManagement />
              <PremiumRightsLicenseManagement />
              <ExclusiveRightsLicenseManagement />
              <StemsRightsLicenseManagement />
            </div>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <ErrorBoundary sectionLabel="Analytics">
            <AnalyticsSection />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="stripe" className="mt-6">
          <ErrorBoundary sectionLabel="Stripe Config">
            <StripeConfigSection />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            Additional settings coming soon...
          </div>
        </TabsContent>

        <TabsContent value="layer1" className="mt-6">
          <ErrorBoundary sectionLabel="Layer 1 — PoL">
            <Layer1SettingsPanel />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="layer2" className="mt-6">
          <ErrorBoundary sectionLabel="Layer 2 — PoSP">
            <Layer2SettingsPanel />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="help" className="mt-6">
          <ErrorBoundary sectionLabel="Help">
            <AdminHelpSection />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="treasury" className="mt-6">
          <AdminTreasuryPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
