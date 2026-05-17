import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AssetManagementSection() {
  const [assetType, setAssetType] = useState<string>("audio");
  const [assets, setAssets] = useState<Array<[string, any]>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadAssets = async () => {
    setIsLoading(true);
    try {
      // Backend doesn't have asset management endpoint yet
      toast.error("Asset management not yet implemented in backend");
      setAssets([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to load assets");
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (url: string, assetId: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = assetId;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/40">
      <CardHeader>
        <CardTitle>Asset Management</CardTitle>
        <CardDescription>
          View and download all uploaded assets by type
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-yellow-500/50 bg-yellow-500/10">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-600 dark:text-yellow-400">
            Asset management functionality is not yet implemented in the
            backend. This feature will be available in a future update.
          </AlertDescription>
        </Alert>

        <div className="flex gap-4">
          <Select value={assetType} onValueChange={setAssetType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="audio">Audio Files</SelectItem>
              <SelectItem value="preview">Preview Clips</SelectItem>
              <SelectItem value="cover">Cover Art</SelectItem>
              <SelectItem value="license">License Documents</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleLoadAssets} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load Assets"
            )}
          </Button>
        </div>

        {assets.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Found {assets.length} {assetType} asset(s)
            </p>
            <div className="grid gap-2">
              {assets.map(([assetId, reference]) => (
                <div
                  key={assetId}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-background/50"
                >
                  <span className="text-sm font-mono truncate flex-1">
                    {assetId}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleDownload(reference.getDirectURL(), assetId)
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {assets.length === 0 && !isLoading && (
          <p className="text-center text-muted-foreground py-8">
            No {assetType} assets loaded
          </p>
        )}
      </CardContent>
    </Card>
  );
}
