import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  Download,
  ExternalLink,
  FileText,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type Beat, DeliveryMethod, RightsType } from "../backend";
import {
  useDownloadLicenseFile,
  useGetBeats,
  useGetGoogleDriveLink,
  useGetRightsZipFile,
  useRecordBeatPurchase,
} from "../hooks/useQueries";
import {
  type CompletedPurchase,
  finalizePaidPurchase,
  getCompletedPaidPurchases,
} from "../utils/purchaseTracking";
import {
  clearPersistedStripeReturnParams,
  detectStripeReturnParams,
  getPersistedStripeReturnParams,
} from "../utils/stripeReturn";
import { removeQueryParams } from "../utils/urlParams";

export default function PurchaseHistoryPage() {
  const { data: beats = [], isLoading: beatsLoading } = useGetBeats();
  const getRightsZip = useGetRightsZipFile();
  const getGoogleDrive = useGetGoogleDriveLink();
  const downloadLicense = useDownloadLicenseFile();
  const recordPurchase = useRecordBeatPurchase();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingLicenseId, setDownloadingLicenseId] = useState<
    string | null
  >(null);
  const [processingStripeReturn, setProcessingStripeReturn] = useState(false);
  const [stripeReturnError, setStripeReturnError] = useState<string | null>(
    null,
  );

  // Handle Stripe success return
  useEffect(() => {
    const handleStripeReturn = async () => {
      // Try to get params from URL first, then from sessionStorage
      let stripeParams = detectStripeReturnParams();

      if (!stripeParams) {
        stripeParams = getPersistedStripeReturnParams();
      }

      // Only process if we have params
      if (!stripeParams) {
        return;
      }

      const { beatId, rightsType, sessionId } = stripeParams;

      // Check if we've already processed this return (idempotency)
      const idempotencyKey = `stripe-return-${sessionId}`;
      if (sessionStorage.getItem(idempotencyKey)) {
        // Already processed, just clean up
        removeQueryParams(["beatId", "rightsType", "session_id"]);
        clearPersistedStripeReturnParams();
        return;
      }

      // Validate session_id is not empty
      if (sessionId.trim() === "") {
        setStripeReturnError(
          "Payment session ID was not found. Please contact support if you completed payment.",
        );
        removeQueryParams(["beatId", "rightsType", "session_id"]);
        clearPersistedStripeReturnParams();
        return;
      }

      // Validate rightsType is a supported value
      const validRightsTypes = [
        RightsType.basicRight,
        RightsType.premiumRight,
        RightsType.exclusiveRight,
        RightsType.stems,
      ];
      if (!validRightsTypes.includes(rightsType as RightsType)) {
        setStripeReturnError("Invalid rights type. Please contact support.");
        removeQueryParams(["beatId", "rightsType", "session_id"]);
        clearPersistedStripeReturnParams();
        return;
      }

      setProcessingStripeReturn(true);

      try {
        // Record the purchase on the backend with the real Stripe session ID
        await recordPurchase.mutateAsync({
          beatId,
          sessionId,
          isFree: false,
          rightsType: rightsType as RightsType,
        });

        // Finalize the local purchase record with the real session ID
        finalizePaidPurchase(beatId, rightsType, sessionId);

        // Mark as processed
        sessionStorage.setItem(idempotencyKey, "true");

        toast.success(
          "Purchase completed successfully! Your files are now available for download.",
        );

        // Show cashback toast — calculate from the beat's rights folder price
        const purchasedBeat = beats.find((b) => b.id === beatId);
        if (purchasedBeat) {
          const folder = purchasedBeat.rightsFolders.find(
            (f) => f.rightsType === rightsType,
          );
          if (folder && Number(folder.priceInCents) > 0) {
            const cashback = Math.floor(
              (Number(folder.priceInCents) * 7) / 100 / 100,
            );
            if (cashback > 0) {
              setTimeout(() => {
                toast.success(`+${cashback} MIK97 Purchase Cashback!`, {
                  duration: 5000,
                });
              }, 800);
            }
          }
        }
      } catch (error: any) {
        console.error("Failed to record purchase:", error);
        const errorMessage =
          error.message ||
          "Failed to finalize purchase. Please contact support.";
        setStripeReturnError(errorMessage);
      } finally {
        setProcessingStripeReturn(false);
        // Clean up in all outcomes
        removeQueryParams(["beatId", "rightsType", "session_id"]);
        clearPersistedStripeReturnParams();
      }
    };

    handleStripeReturn();
  }, [recordPurchase, beats]);

  const allPurchases: CompletedPurchase[] = [
    ...getCompletedPaidPurchases(),
    ...(JSON.parse(
      localStorage.getItem("freePurchases") || "[]",
    ) as CompletedPurchase[]),
  ];

  const purchasedBeats = beats.filter((beat) =>
    allPurchases.some((purchase) => purchase.beatId === beat.id),
  );

  const getPurchaseInfo = (beatId: string) => {
    return allPurchases.filter((p) => p.beatId === beatId);
  };

  const getRightsLabel = (rightsType: string) => {
    switch (rightsType) {
      case RightsType.basicRight:
        return "Basic Right";
      case RightsType.premiumRight:
        return "Premium Right";
      case RightsType.exclusiveRight:
        return "Exclusive Right";
      case RightsType.stems:
        return "Stems";
      default:
        return "Unknown Right";
    }
  };

  const handleDownload = async (beat: Beat, purchase: CompletedPurchase) => {
    const downloadKey = `${beat.id}-${purchase.rightsType}`;
    setDownloadingId(downloadKey);

    try {
      if (beat.deliveryMethod === DeliveryMethod.zipFiles) {
        // Handle ZIP file download
        const zipBlob = await getRightsZip.mutateAsync({
          beatId: beat.id,
          rightsType: purchase.rightsType as RightsType,
          sessionId: purchase.sessionId,
        });

        if (!zipBlob) {
          throw new Error("ZIP file not available");
        }

        // Convert ExternalBlob to downloadable blob
        const bytes = await zipBlob.getBytes();
        const blob = new Blob([bytes], { type: "application/zip" });
        const url = URL.createObjectURL(blob);

        // Create download link
        const link = document.createElement("a");
        link.href = url;
        link.download = `${beat.title}-${getRightsLabel(purchase.rightsType)}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        URL.revokeObjectURL(url);

        toast.success("Download started!");
      } else if (beat.deliveryMethod === DeliveryMethod.googleDrive) {
        // Handle Google Drive link
        const driveLink = await getGoogleDrive.mutateAsync({
          beatId: beat.id,
          rightsType: purchase.rightsType as RightsType,
          sessionId: purchase.sessionId,
        });

        if (!driveLink) {
          throw new Error("Google Drive link not available");
        }

        // Open Google Drive link in new tab
        window.open(driveLink, "_blank");
        toast.success("Opening Google Drive link...");
      }
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error(error.message || "Failed to download files");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadLicense = async (
    beat: Beat,
    purchase: CompletedPurchase,
  ) => {
    const licenseKey = `${beat.id}-${purchase.rightsType}-license`;
    setDownloadingLicenseId(licenseKey);

    try {
      const licenseFiles = await downloadLicense.mutateAsync({
        beatId: beat.id,
        rightsType: purchase.rightsType as RightsType,
        sessionId: purchase.sessionId,
      });

      // Check if license files are available
      if (!licenseFiles || licenseFiles.length === 0) {
        toast.error("License is not available for this rights type.");
        return;
      }

      // Download each license file
      for (let i = 0; i < licenseFiles.length; i++) {
        const licenseBlob = licenseFiles[i];
        const bytes = await licenseBlob.getBytes();
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        const fileName =
          licenseFiles.length > 1
            ? `${beat.title}-${getRightsLabel(purchase.rightsType)}-License-${i + 1}.pdf`
            : `${beat.title}-${getRightsLabel(purchase.rightsType)}-License.pdf`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
      }

      toast.success("License download started!");
    } catch (error: any) {
      console.error("License download error:", error);
      toast.error(error.message || "Failed to download license");
    } finally {
      setDownloadingLicenseId(null);
    }
  };

  if (beatsLoading || processingStripeReturn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {processingStripeReturn
              ? "Processing your purchase..."
              : "Loading purchase history..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-4xl font-bold mb-8 text-[#a970ff]">
          Purchase History
        </h1>

        {stripeReturnError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{stripeReturnError}</AlertDescription>
          </Alert>
        )}

        {purchasedBeats.length === 0 ? (
          <Card className="bg-card border-border/40">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-lg">No purchases yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your purchased beats will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {purchasedBeats.map((beat) => {
              const purchases = getPurchaseInfo(beat.id);
              return (
                <Card key={beat.id} className="bg-card border-border/40">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl text-foreground">
                          {beat.title}
                        </CardTitle>
                        <p className="text-muted-foreground mt-1">
                          by {beat.artist}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {beat.deliveryMethod === DeliveryMethod.zipFiles
                          ? "ZIP Files"
                          : "Google Drive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {purchases.map((purchase, _idx) => {
                        const downloadKey = `${beat.id}-${purchase.rightsType}`;
                        const licenseKey = `${beat.id}-${purchase.rightsType}-license`;
                        const isDownloading = downloadingId === downloadKey;
                        const isDownloadingLicense =
                          downloadingLicenseId === licenseKey;

                        return (
                          <div
                            key={downloadKey}
                            className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/40"
                          >
                            <div className="flex items-center gap-3">
                              <Badge className="bg-primary/20 text-primary border-primary/30">
                                {getRightsLabel(purchase.rightsType)}
                              </Badge>
                              {purchase.isFree && (
                                <Badge variant="outline" className="text-xs">
                                  Free
                                </Badge>
                              )}
                              <span className="text-sm text-muted-foreground">
                                {new Date(
                                  purchase.timestamp,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() =>
                                  handleDownloadLicense(beat, purchase)
                                }
                                disabled={isDownloadingLicense}
                                size="sm"
                                variant="outline"
                                className="border-primary/30 hover:bg-primary/10"
                              >
                                {isDownloadingLicense ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                  </>
                                ) : (
                                  <>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Download License
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={() => handleDownload(beat, purchase)}
                                disabled={isDownloading}
                                size="sm"
                                className="bg-primary hover:bg-primary/90"
                              >
                                {isDownloading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                  </>
                                ) : beat.deliveryMethod ===
                                  DeliveryMethod.zipFiles ? (
                                  <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                  </>
                                ) : (
                                  <>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Open Drive
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
