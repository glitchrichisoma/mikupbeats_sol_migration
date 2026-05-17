import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { PageType } from "../backend";
import MixtapeCard from "../components/MixtapeCard";
import MixtapeSubmissionForm from "../components/MixtapeSubmissionForm";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetApprovedMixtapes,
  useRecordSiteVisit,
} from "../hooks/useQueries";

const SKELETON_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6"] as const;

export default function MixtapesPage() {
  const { data: mixtapes = [], isLoading } = useGetApprovedMixtapes();
  const { identity } = useInternetIdentity();
  const recordVisit = useRecordSiteVisit();
  const [searchQuery, setSearchQuery] = useState("");

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally omit to run once
  useEffect(() => {
    recordVisit.mutate(PageType.mixtapes);
  }, []);

  const filteredMixtapes = mixtapes.filter((mixtape) => {
    const query = searchQuery.toLowerCase();
    return (
      mixtape.title.toLowerCase().includes(query) ||
      mixtape.artistName.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-[#a970ff]">
          Mixtape &amp; Album Drops
        </h1>
        <p className="text-muted-foreground">
          Discover full-length projects from talented artists
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search mixtapes by title or artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card/50 border-border/40"
          />
        </div>
        {identity && <MixtapeSubmissionForm />}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SKELETON_KEYS.map((k) => (
            <div
              key={k}
              className="rounded-lg overflow-hidden border border-border"
            >
              <div className="skeleton-block h-44 w-full rounded-none" />
              <div className="p-4 bg-card space-y-3">
                <div className="skeleton-block h-5 w-3/4" />
                <div className="skeleton-block h-4 w-1/2" />
                <div className="skeleton-block h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredMixtapes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery
              ? "No mixtapes found matching your search."
              : "No mixtapes available yet. Check back soon!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMixtapes.map((mixtape) => (
            <MixtapeCard key={mixtape.id} mixtape={mixtape} />
          ))}
        </div>
      )}
    </div>
  );
}
