import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import {
  useDeleteStemsRightsLicense,
  useGetStemsRightsLicense,
  useUploadStemsRightsLicense,
} from "../hooks/useQueries";

export default function StemsRightsLicenseManagement() {
  const { data: currentLicense, isLoading } = useGetStemsRightsLicense();
  const uploadLicense = useUploadStemsRightsLicense();
  const deleteLicense = useDeleteStemsRightsLicense();

  const [uploading, setUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error(
        "Invalid file type. Please upload PDF, DOC, DOCX, or TXT files only.",
      );
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size too large. Maximum size is 10MB.");
      return;
    }

    setUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(uint8Array);

      await uploadLicense.mutateAsync(blob);
      toast.success("License document uploaded successfully!");

      // Reset file input
      event.target.value = "";
    } catch (error: any) {
      console.error("License upload error:", error);
      toast.error(error.message || "Failed to upload license document");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!currentLicense) return;

    try {
      const bytes = await currentLicense.getBytes();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "Stems-Rights-License.pdf";
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("License document downloaded!");
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error("Failed to download license document");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLicense.mutateAsync();
      toast.success("License document deleted successfully");
      setShowDeleteDialog(false);
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete license document");
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Stems Rights License Agreement
        </CardTitle>
        <CardDescription>
          Manage the license document that will be automatically included with
          all Stems ZIP file downloads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Alert */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : currentLicense ? (
          <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-sm text-green-900 dark:text-green-100">
              <strong>License Active:</strong> The Stems Rights License
              Agreement is currently uploaded and will be automatically included
              in all Stems ZIP file downloads.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-sm text-yellow-900 dark:text-yellow-100">
              <strong>No License Uploaded:</strong> Upload a license document to
              automatically include it in Stems ZIP downloads.
            </AlertDescription>
          </Alert>
        )}

        {/* Info Alert */}
        <Alert className="border-primary/30 bg-primary/5">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <strong>How it works:</strong> When a user purchases or downloads
            Stems with ZIP delivery, the license document will be automatically
            included in the downloaded ZIP file. Google Drive deliveries are not
            affected.
          </AlertDescription>
        </Alert>

        {/* Current License Section */}
        {currentLicense && (
          <div className="space-y-3 p-4 border border-border/40 rounded-lg bg-background/50">
            <p className="font-medium text-foreground">
              Current License Document
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Current License
              </Button>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="destructive"
                size="sm"
                disabled={deleteLicense.isPending}
              >
                {deleteLicense.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="space-y-3 p-4 border border-border/40 rounded-lg bg-background/50">
          <p className="font-medium text-foreground">
            {currentLicense
              ? "Replace License Document"
              : "Upload License Document"}
          </p>
          <div className="space-y-2">
            <input
              type="file"
              id="stems-license-upload"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <label htmlFor="stems-license-upload">
              <Button
                asChild
                disabled={uploading}
                className="w-full cursor-pointer"
              >
                <span>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {currentLicense ? "Replace License" : "Upload License"}
                    </>
                  )}
                </span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, DOC, DOCX, TXT (Max 10MB)
            </p>
          </div>
        </div>

        {/* Feature Description */}
        <div className="text-sm text-muted-foreground space-y-3 p-4 border border-border/40 rounded-lg bg-background/50">
          <p className="font-medium text-foreground">Integration Details:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              The license document is automatically included in all Stems ZIP
              file downloads
            </li>
            <li>Only applies to ZIP-based delivery (not Google Drive links)</li>
            <li>
              The document is added by the backend during the download process
            </li>
            <li>
              Users receive the license along with their purchased audio files
            </li>
            <li>
              Updating the license will affect all future downloads immediately
            </li>
          </ul>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete License Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the Stems Rights License Agreement from the
              system. Future Stems ZIP downloads will not include a license
              document until you upload a new one. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete License
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
