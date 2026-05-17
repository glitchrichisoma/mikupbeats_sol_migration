import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Loader2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useIsStripeConfigured,
  useSetStripeConfiguration,
} from "../hooks/useQueries";

export default function StripeConfigSection() {
  const { data: isConfigured, isLoading } = useIsStripeConfigured();
  const setConfig = useSetStripeConfiguration();
  const [secretKey, setSecretKey] = useState("");
  const [countries, setCountries] = useState("US,CA,GB");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!secretKey.trim()) {
      toast.error("Please enter Stripe secret key");
      return;
    }

    try {
      await setConfig.mutateAsync({
        secretKey: secretKey.trim(),
        allowedCountries: countries.split(",").map((c) => c.trim()),
      });
      toast.success("Stripe configuration saved successfully!");
      setSecretKey("");
    } catch (error: any) {
      toast.error(error.message || "Failed to save configuration");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm border-border/40">
        <CardHeader>
          <CardTitle>Stripe Configuration</CardTitle>
          <CardDescription>
            Configure Stripe payment processing for guest and authenticated user
            checkouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConfigured ? (
            <Alert className="mb-4 border-green-500/50 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                Stripe is configured and ready to process payments
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-4 border-yellow-500/50 bg-yellow-500/10">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-500">
                Stripe is not configured. Please add your Stripe secret key to
                enable payments.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="secretKey">Stripe Secret Key *</Label>
              <Input
                id="secretKey"
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="sk_test_... or sk_live_..."
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your Stripe secret key (starts with sk_test_ or sk_live_)
              </p>
            </div>

            <div>
              <Label htmlFor="countries">
                Allowed Countries (comma-separated)
              </Label>
              <Input
                id="countries"
                value={countries}
                onChange={(e) => setCountries(e.target.value)}
                placeholder="US,CA,GB"
              />
              <p className="text-xs text-muted-foreground mt-1">
                ISO country codes for allowed payment countries
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={setConfig.isPending}
            >
              {setConfig.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Configuration
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border/40">
        <CardHeader>
          <CardTitle>Stripe Diagnostics</CardTitle>
          <CardDescription>
            Connection status and configuration details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm font-medium">Configuration Status</span>
            <span
              className={`text-sm font-semibold ${isConfigured ? "text-green-500" : "text-yellow-500"}`}
            >
              {isConfigured ? "Configured" : "Not Configured"}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm font-medium">Guest Checkout</span>
            <span className="text-sm font-semibold text-green-500">
              Enabled
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm font-medium">Authenticated Checkout</span>
            <span className="text-sm font-semibold text-green-500">
              Enabled
            </span>
          </div>
          <Alert className="mt-4">
            <AlertDescription className="text-xs">
              <strong>Note:</strong> Both secret and publishable keys are stored
              in the backend. The secret key is used for server-side operations,
              while the publishable key (if provided) can be used for
              client-side Stripe.js integration. Guest users can complete
              purchases without creating an account.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
