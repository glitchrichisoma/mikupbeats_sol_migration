import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Radio,
  Settings,
  Shield,
  ShoppingCart,
  Store,
  User,
  Users,
  Youtube,
} from "lucide-react";

export default function AdminHelpSection() {
  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm border-border/40">
        <CardHeader>
          <CardTitle>MikupBeats Platform Overview</CardTitle>
          <CardDescription>
            Complete guide to all implemented features and functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="authentication">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>Authentication & User Roles</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <p>
                  <strong>Optional Authentication:</strong> Users can browse and
                  purchase beats as guests or log in with Internet Identity for
                  enhanced features.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline">Guest</Badge>
                    <span>
                      Browse beats, preview audio, make purchases via guest
                      checkout
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline">User</Badge>
                    <span>
                      All guest features plus profile management, purchase
                      history, showcase submissions
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline">Admin</Badge>
                    <span>
                      Full platform control including beat uploads, approvals,
                      and configuration
                    </span>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  The first user to log in automatically becomes the admin.
                  Profile setup is prompted on first login.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="storefront">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  <span>Beat Store & Browsing</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <p>
                  <strong>Public Access:</strong> All users (guest and
                  authenticated) can browse the complete beat catalog with
                  advanced filtering.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Grid view display with cover art and metadata</li>
                  <li>
                    Filter by category (Hip Hop, Pop, Rock, Electronic, Lo-Fi)
                  </li>
                  <li>
                    Filter by style (Old School, Modern, Trap, Jazz Influence,
                    etc.)
                  </li>
                  <li>Filter by texture (Smooth, Gritty, Melodic, Upbeat)</li>
                  <li>
                    Audio preview with global playback control (one beat plays
                    at a time)
                  </li>
                  <li>Rights classification display (Premium or Exclusive)</li>
                  <li>Scroll position persistence for seamless browsing</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="checkout">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  <span>Checkout & Payments</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <p>
                  <strong>Guest Checkout Enabled:</strong> Stripe integration
                  supports purchases without account creation.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>One-click purchase button on each beat card</li>
                  <li>Stripe checkout popup with sequential payment flow</li>
                  <li>Guest users can complete purchases without logging in</li>
                  <li>
                    Authenticated users have purchases tracked in their account
                  </li>
                  <li>
                    Automatic redirect to success/failure pages after payment
                  </li>
                  <li>
                    Support for multiple currencies and international payments
                  </li>
                </ul>
                <p className="text-muted-foreground">
                  Configure Stripe in the admin panel to enable payment
                  processing.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="beat-management">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <span>Beat Management (Admin)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <p>
                  <strong>Admin-Only:</strong> Comprehensive beat upload and
                  management system.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    Upload beats with metadata (title, artist, category, style,
                    texture, price)
                  </li>
                  <li>
                    Multiple asset types: audio files (MP3, WAV), stems, license
                    documents, cover art
                  </li>
                  <li>Rights classification (Premium or Exclusive)</li>
                  <li>File upload with progress indicators and validation</li>
                  <li>Beat review interface with expandable details</li>
                  <li>
                    Asset management by type (audio, license, cover, preview)
                  </li>
                  <li>Edit and delete functionality for existing beats</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="showcase">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Showcase Gallery</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <p>
                  <strong>Public Gallery:</strong> Display approved artist
                  showcases with admin moderation.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    Grid display of approved showcases (visible to all users)
                  </li>
                  <li>
                    Authenticated users can submit showcases after registration
                  </li>
                  <li>Audio upload or external link options for submissions</li>
                  <li>Admin approval required before public display</li>
                  <li>Bulk approve functionality in admin dashboard</li>
                  <li>Integration with global audio player for playback</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="live">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Radio className="h-5 w-5 text-primary" />
                  <span>Live Streaming</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <p>
                  <strong>YouTube Integration:</strong> Embedded live stream
                  player accessible to all users.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Embedded YouTube live stream player</li>
                  <li>Dynamically loaded from backend-configured URL</li>
                  <li>Accessible to all users without authentication</li>
                  <li>Admin dashboard for YouTube URL management</li>
                  <li>URL validation and preview functionality</li>
                  <li>Responsive iframe layout for all devices</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="account">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <span>User Account Management</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <p>
                  <strong>Authenticated Users:</strong> Profile and purchase
                  tracking for logged-in users.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Profile setup page for name and creator status</li>
                  <li>Automatic profile creation prompt on first login</li>
                  <li>Purchase history page with transaction records</li>
                  <li>Account setup accessible via hamburger menu</li>
                  <li>User approval system for creator privileges</li>
                  <li>Role-based access control (admin, user, guest)</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="navigation">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-primary" />
                  <span>Navigation & UI</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <p>
                  <strong>Responsive Design:</strong> Mobile-optimized
                  navigation with dark theme and purple accents.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Hamburger menu with slide-out navigation panel</li>
                  <li>
                    Fixed bottom quick link bar (Store, Showcase, Live, About,
                    Admin)
                  </li>
                  <li>Active section highlighting with purple glow effects</li>
                  <li>Auto scroll-to-top with position persistence</li>
                  <li>Responsive layout for mobile and desktop</li>
                  <li>Dark theme with purple/pink gradient color palette</li>
                  <li>Smooth transitions and consistent branding</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="admin-config">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <span>Admin Configuration</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <p>
                  <strong>Platform Settings:</strong> Centralized configuration
                  for payments and integrations.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    Stripe configuration with secret key and allowed countries
                  </li>
                  <li>Stripe diagnostics panel showing connection status</li>
                  <li>YouTube live URL management with validation</li>
                  <li>User approval management interface</li>
                  <li>Analytics and purchase tracking (coming soon)</li>
                  <li>Comprehensive help documentation (this section)</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border/40">
        <CardHeader>
          <CardTitle>Quick Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Guest Checkout:</strong> Users can purchase beats without
            creating an account. Purchases are processed through Stripe and do
            not require authentication.
          </p>
          <p>
            <strong>Stripe Setup:</strong> Configure your Stripe secret key in
            the Stripe tab to enable payment processing. Both test and live keys
            are supported.
          </p>
          <p>
            <strong>Beat Organization:</strong> Use categories, styles, and
            textures to help users find the perfect beat. All filters are
            available to guest users.
          </p>
          <p>
            <strong>Showcase Moderation:</strong> Review and approve
            user-submitted showcases to maintain quality standards on your
            platform.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
