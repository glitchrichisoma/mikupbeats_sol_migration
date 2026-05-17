import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  Database,
  ExternalLink,
  Flame,
  RefreshCw,
  Search,
  Shield,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  useGetPlatformToggles,
  useGetPublicTransactionLedger,
  useGetPublicTransactionLedgerCount,
  useIsCallerAdmin,
} from "../hooks/useQueries";

const PAGE_SIZE = 25n;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTs(ts: bigint | number): string {
  if (!ts) return "—";
  const n = typeof ts === "bigint" ? Number(ts) : ts;
  // ICP timestamps are nanoseconds (> 1e15); browser Date uses ms
  const ms = n > 1e15 ? n / 1_000_000 : n;
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const d = new Date(ms);
  return `${d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })} ${d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}`;
}

function fmtAmount(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "0";
  const abs = Math.abs(n);
  return (
    (n < 0 ? "-" : "+") +
    abs
      .toFixed(8)
      .replace(/(\.\d*?)0+$/, "$1")
      .replace(/\.$/, "")
  );
}

function truncatePrincipal(p: string, max = 16): string {
  if (!p || p === "system") return p || "—";
  if (p.length <= max) return p;
  return `${p.slice(0, 8)}…${p.slice(-4)}`;
}

function humanizeAction(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type TxFilter = "all" | "admin" | "user" | "system";

function txTypeBadge(txType: string) {
  const t = txType.toLowerCase();
  if (t.includes("admin"))
    return (
      <Badge
        variant="outline"
        className="text-xs border-yellow-500/60 text-yellow-400 shrink-0"
      >
        Admin
      </Badge>
    );
  if (t.includes("user"))
    return (
      <Badge
        variant="outline"
        className="text-xs border-primary/60 text-primary shrink-0"
      >
        User
      </Badge>
    );
  if (t.includes("burn"))
    return (
      <Badge
        variant="outline"
        className="text-xs border-destructive/60 text-destructive shrink-0"
      >
        🔥 Burn
      </Badge>
    );
  return (
    <Badge
      variant="outline"
      className="text-xs border-muted-foreground/40 text-muted-foreground shrink-0"
    >
      System
    </Badge>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LedgerExplorerPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<TxFilter>("all");

  const offset = BigInt(page) * PAGE_SIZE;

  const { data: isAdmin } = useIsCallerAdmin();
  const { data: platformToggles } = useGetPlatformToggles();

  const canView = isAdmin || platformToggles?.showPublicLedger;

  const {
    data: entries = [],
    isLoading,
    refetch,
  } = useGetPublicTransactionLedger(PAGE_SIZE, offset);
  const { data: totalCount = 0n } = useGetPublicTransactionLedgerCount();

  const totalPages = Math.max(
    1,
    Math.ceil(Number(totalCount) / Number(PAGE_SIZE)),
  );

  // Client-side filtering on the current page
  const filtered = useMemo(() => {
    let rows = entries;
    if (activeFilter !== "all") {
      rows = rows.filter((e) => {
        const t = (e.txType ?? "").toLowerCase();
        if (activeFilter === "admin") return t.includes("admin");
        if (activeFilter === "user") return t.includes("user");
        if (activeFilter === "system")
          return t.includes("system") || t.includes("burn");
        return true;
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (e) =>
          (e.action ?? "").toLowerCase().includes(q) ||
          (e.pool ?? "").toLowerCase().includes(q) ||
          (e.initiator ?? "").toLowerCase().includes(q) ||
          (e.txType ?? "").toLowerCase().includes(q),
      );
    }
    return rows;
  }, [entries, activeFilter, search]);

  // Global burn total derived from system burns in full dataset
  const globalBurnTotal = useMemo(() => {
    return entries
      .filter(
        (e) =>
          (e.txType ?? "").toLowerCase().includes("burn") ||
          (e.action ?? "").toLowerCase().includes("burn"),
      )
      .reduce((sum, e) => sum + Math.abs(e.amount ?? 0), 0);
  }, [entries]);

  const FILTERS: { key: TxFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "admin", label: "Admin Actions" },
    { key: "user", label: "User Actions" },
    { key: "system", label: "System & Burns" },
  ];

  if (platformToggles !== undefined && !canView) {
    return (
      <div
        className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4"
        data-ocid="ledger.hidden_state"
      >
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center">
            <Shield className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Ledger Hidden</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The public transaction ledger is currently restricted. Only the
            platform admin can view it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-ocid="ledger.page">
      {/* Hero Header */}
      <div className="bg-card border-b border-border px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    MIK97 Transaction Ledger
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    All platform token movements — verified and transparent
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {globalBurnTotal > 0 && (
                <div
                  className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2"
                  data-ocid="ledger.burn_total_badge"
                >
                  <Flame className="h-4 w-4 text-destructive" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Total Burned (this page)
                    </p>
                    <p className="text-sm font-bold text-destructive font-mono">
                      {globalBurnTotal.toFixed(4)} MIK97
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Total Transactions
                  </p>
                  <p className="text-sm font-bold text-foreground font-mono">
                    {Number(totalCount).toLocaleString()}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
                data-ocid="ledger.refresh_button"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by action, pool, initiator…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-input"
              data-ocid="ledger.search_input"
            />
          </div>
          <div
            className="flex gap-1.5 flex-wrap"
            data-ocid="ledger.filter_tabs"
          >
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                data-ocid={`ledger.filter.${f.key}`}
                onClick={() => setActiveFilter(f.key)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeFilter === f.key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div
          className="rounded-xl border border-border bg-card overflow-hidden"
          data-ocid="ledger.table"
        >
          {isLoading ? (
            <div className="p-6 space-y-3">
              {["a", "b", "c", "d", "e", "f", "g", "h"].map((k) => (
                <Skeleton key={k} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              data-ocid="ledger.empty_state"
            >
              <Database className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">
                No transactions found
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {search
                  ? "Try a different search term or filter."
                  : "No transactions have been recorded yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-muted/20">
                    <TableHead className="text-muted-foreground text-xs w-12">
                      #
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      Timestamp
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      Action
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      Pool
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      Initiator
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right">
                      Amount
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      Type
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((entry, i) => {
                    const txIdNum =
                      typeof entry.txId === "bigint"
                        ? Number(entry.txId)
                        : (entry.txId ?? 0);
                    const amt =
                      typeof entry.amount === "number" ? entry.amount : 0;
                    const action = entry.action ?? "";
                    const pool = entry.pool ?? "";
                    const initiator = entry.initiator ?? "";
                    const txType = entry.txType ?? "system_action";
                    return (
                      <TableRow
                        key={`tx-${txIdNum}-${entry.pool ?? ""}-${i}`}
                        className="border-border hover:bg-muted/10 transition-colors"
                        data-ocid={`ledger.item.${i + 1}`}
                      >
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {txIdNum}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTs(entry.timestamp ?? 0n)}
                        </TableCell>
                        <TableCell className="text-xs text-foreground">
                          {humanizeAction(action)}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-primary font-medium">
                            {pool}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          <span title={initiator}>
                            {truncatePrincipal(initiator)}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-right">
                          <span
                            className={`font-semibold ${
                              amt < 0
                                ? "text-destructive"
                                : amt > 0
                                  ? "text-emerald-400"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {fmtAmount(amt)}
                          </span>
                        </TableCell>
                        <TableCell>{txTypeBadge(txType)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between"
            data-ocid="ledger.pagination"
          >
            <p className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages} &middot;{" "}
              {Number(totalCount).toLocaleString()} total transactions
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || isLoading}
                data-ocid="ledger.pagination_prev"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || isLoading}
                data-ocid="ledger.pagination_next"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
