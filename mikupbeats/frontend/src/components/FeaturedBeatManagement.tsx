import { Badge } from "@/components/ui/badge";
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
import { Loader2, Star, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useClearFeaturedBeat,
  useGetBeats,
  useGetFeaturedBeat,
  useSetFeaturedBeat,
} from "../hooks/useQueries";

export default function FeaturedBeatManagement() {
  const { data: beats, isLoading: beatsLoading } = useGetBeats();
  const { data: featuredBeat, isLoading: featuredLoading } =
    useGetFeaturedBeat();
  const setFeaturedBeat = useSetFeaturedBeat();
  const clearFeaturedBeat = useClearFeaturedBeat();
  const [selectedBeatId, setSelectedBeatId] = useState<string>("");

  const handleSetFeatured = async () => {
    if (!selectedBeatId) {
      toast.error("Please select a beat to feature");
      return;
    }

    try {
      await setFeaturedBeat.mutateAsync(selectedBeatId);
      const selectedBeat = beats?.find((b) => b.id === selectedBeatId);
      toast.success(`"${selectedBeat?.title}" is now the featured beat!`);
      setSelectedBeatId("");
    } catch (error) {
      console.error("Error setting featured beat:", error);
      toast.error("Failed to set featured beat. Please try again.");
    }
  };

  const handleClearFeatured = async () => {
    try {
      await clearFeaturedBeat.mutateAsync();
      toast.success("Featured beat cleared");
    } catch (error) {
      console.error("Error clearing featured beat:", error);
      toast.error("Failed to clear featured beat. Please try again.");
    }
  };

  if (beatsLoading || featuredLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          Featured Beat Management
        </CardTitle>
        <CardDescription>
          Select a beat to feature at the top of the Store page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Featured Beat */}
        {featuredBeat && (
          <div className="p-4 border border-primary/30 rounded-lg bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Currently Featured:
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFeatured}
                disabled={clearFeaturedBeat.isPending}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {clearFeaturedBeat.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </>
                )}
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="default"
                className="bg-gradient-to-r from-primary to-accent"
              >
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
              <div>
                <p className="font-semibold">{featuredBeat.title}</p>
                <p className="text-sm text-muted-foreground">
                  by {featuredBeat.artist}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Set New Featured Beat */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="featured-beat-select"
              className="text-sm font-medium mb-2 block"
            >
              Select Beat to Feature
            </label>
            <Select value={selectedBeatId} onValueChange={setSelectedBeatId}>
              <SelectTrigger id="featured-beat-select" className="w-full">
                <SelectValue placeholder="Choose a beat..." />
              </SelectTrigger>
              <SelectContent>
                {beats?.map((beat) => (
                  <SelectItem key={beat.id} value={beat.id}>
                    {beat.title} - {beat.artist}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSetFeatured}
            disabled={!selectedBeatId || setFeaturedBeat.isPending}
            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            {setFeaturedBeat.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Setting Featured Beat...
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" />
                Set as Featured Beat
              </>
            )}
          </Button>
        </div>

        {!beats || beats.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No beats available. Upload beats first to feature them.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
