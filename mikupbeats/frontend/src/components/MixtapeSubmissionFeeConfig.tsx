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
import { Switch } from "@/components/ui/switch";
import { AlertCircle, DollarSign, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useGetMixtapeSubmissionFeeConfig,
  useSetMixtapeSubmissionFeeConfig,
} from "../hooks/useQueries";

export default function MixtapeSubmissionFeeConfig() {
  const { data: feeConfig, isLoading } = useGetMixtapeSubmissionFeeConfig();
  const setFeeConfig = useSetMixtapeSubmissionFeeConfig();
  const [enabled, setEnabled] = useState(false);
  const [priceInDollars, setPriceInDollars] = useState("0.00");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (feeConfig) {
      setEnabled(feeConfig.enabled);
      setPriceInDollars((Number(feeConfig.priceInCents) / 100).toFixed(2));
    }
  }, [feeConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const priceInCents = Math.round(Number.parseFloat(priceInDollars) * 100);

      if (Number.isNaN(priceInCents) || priceInCents < 0) {
        toast.error("Please enter a valid price");
        return;
      }

      await setFeeConfig.mutateAsync({
        enabled,
        priceInCents: BigInt(priceInCents),
      });

      toast.success("Submission fee configuration updated successfully");
    } catch (error: any) {
      toast.error(
        error.message || "Failed to update submission fee configuration",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/40">
        <CardHeader>
          <CardTitle className="text-[#a970ff]">
            Mixtape Submission Fee
          </CardTitle>
          <CardDescription>Loading configuration...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/40">
      <CardHeader>
        <CardTitle className="text-[#a970ff] flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Mixtape Submission Fee Configuration
        </CardTitle>
        <CardDescription>
          Configure whether mixtape/album submissions require payment and set
          the submission fee
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="bg-blue-500/10 border-blue-500/30">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-sm">
            When paid mode is enabled, artists will be required to complete a
            Stripe payment before their mixtape submission is processed. Admin
            submissions are always free.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="submission-fee-enabled" className="text-base">
              Enable Paid Submissions
            </Label>
            <p className="text-sm text-muted-foreground">
              Require payment for mixtape/album submissions
            </p>
          </div>
          <Switch
            id="submission-fee-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {enabled && (
          <div className="space-y-2">
            <Label htmlFor="submission-price">Submission Fee (USD)</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                id="submission-price"
                type="number"
                step="0.01"
                min="0"
                value={priceInDollars}
                onChange={(e) => setPriceInDollars(e.target.value)}
                className="bg-background/50 border-border/40"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the submission fee in dollars (e.g., 5.00 for $5.00)
            </p>
          </div>
        )}

        <div className="pt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#a970ff] hover:bg-[#9860ef] text-white"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </div>

        <div className="pt-4 border-t border-border/40">
          <h4 className="font-semibold mb-2">Current Status</h4>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Mode:</span>{" "}
              <span
                className={
                  enabled
                    ? "text-[#a970ff] font-semibold"
                    : "text-green-500 font-semibold"
                }
              >
                {enabled ? "Paid Submissions" : "Free Submissions"}
              </span>
            </p>
            {enabled && (
              <p>
                <span className="text-muted-foreground">Fee:</span>{" "}
                <span className="font-semibold">${priceInDollars} USD</span>
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
