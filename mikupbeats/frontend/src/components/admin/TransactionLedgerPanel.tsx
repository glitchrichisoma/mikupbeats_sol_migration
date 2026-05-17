import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Copy,
  Download,
  Flame,
  RefreshCw,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useGetBurnStats,
  useGetTransactionLedger,
  useGetTransactionLedgerCount,
} from "../../hooks/useQueries";
import type {
  TransactionLedgerEntry,
  TransactionLedgerFilters,
} from "../../types/treasury";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMik97(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "0";
  return value
    .toFixed(8)
    .replace(/(\.(\d*?))0+$/, "$1")
    .replace(/\.$/, "");
}

function formatTimestamp(ts: number): string {
  if (!ts) return "—";
  // ts can be nanoseconds or milliseconds — detect by magnitude
  const ms = ts > 1e15 ? ts / 1_000_000 : ts;
  const d = new Date(ms);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const yy = String(d.getUTCFullYear()).slice(-2);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return `${mm}/${dd}/${yy} ${hh}:${min} UTC`;
}

function formatFullTimestamp(ts: number): string {
  if (!ts) return "—";
  const ms = ts > 1e15 ? ts / 1_000_000 : ts;
  return new Date(ms).toUTCString();
}

function truncatePrincipal(s: string): string {
  if (!s || s === "—" || s === "system") return s;
  if (s.length <= 14) return s;
  return `${s.slice(0, 8)}…${s.slice(-5)}`;
}

function humanizeAction(action: string): string {
  const map: Record<string, string> = {
    earn_tokens: "Earn Tokens",
    burn_tokens: "Burn Tokens",
    buy_back: "Buy Back",
    staking_penalty_burn: "Staking Penalty (Burn)",
    staking_penalty_pool_return: "Staking Penalty (Pool Return)",
    stakeTokens: "Stake Tokens",
    unstakeTokens: "Unstake Tokens",
    claimStakingRewards: "Claim Staking Rewards",
    teamPayout: "Team Payout",
    personalAllocationClaim: "Personal Allocation Claim",
    airdrop: "Airdrop",
    manualRelease: "Manual Release",
    scheduledRelease: "Scheduled Release",
    autoRelease: "Auto Release",
    expansionRelease: "Expansion Reserve Release",
    reserveTransfer: "Reserve Transfer",
    poolExpansion: "Pool Ceiling Expansion",
  };
  return (
    map[action] ??
    action
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function isBurnAction(action: string): boolean {
  return (
    action.toLowerCase().includes("burn") ||
    action === "staking_penalty_burn" ||
    action.toLowerCase().includes("buyback") ||
    action.toLowerCase().includes("buy_back")
  );
}

function txTypeBadgeClass(txType: TransactionLedgerEntry["txType"]): string {
  switch (txType) {
    case "admin_action":
      return "border-primary text-primary";
    case "user_action":
      return "border-blue-400 text-blue-400";
    case "system_action":
      return "border-yellow-500 text-yellow-500";
    default:
      return "border-muted-foreground text-muted-foreground";
  }
}

const ROWS_PER_PAGE = 25;

const POOL_OPTIONS = [
  { label: "All Pools", value: "all" },
  { label: "Rewards", value: "rewards" },
  { label: "Promotions", value: "promotions" },
  { label: "Reserve", value: "reserve" },
  { label: "Liquidity", value: "liquidity" },
  { label: "Platform / Team", value: "platform" },
  { label: "Expansion", value: "expansion" },
  { label: "Staking Vault", value: "staking" },
];

// ── Expandable Row ────────────────────────────────────────────────────────────

function TxRow({
  entry,
  index,
}: {
  entry: TransactionLedgerEntry;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isBurn = isBurnAction(entry.action);

  return (
    <>
      <TableRow
        className={`border-border cursor-pointer hover:bg-muted/20 transition-colors ${
          isBurn ? "bg-destructive/5" : ""
        }`}
        onClick={() => setExpanded((v) => !v)}
        data-ocid={`ledger.tx.item.${index + 1}`}
      >
        <TableCell className="text-xs text-muted-foreground font-mono">
          #{entry.txId}
        </TableCell>
        <TableCell className="text-xs text-foreground whitespace-nowrap">
          {formatTimestamp(entry.timestamp)}
        </TableCell>
        <TableCell className="max-w-[180px]">
          <Badge
            variant="outline"
            className={`text-xs ${
              isBurn
                ? "border-destructive text-destructive"
                : "border-muted-foreground text-foreground"
            }`}
          >
            {isBurn && <Flame className="h-2.5 w-2.5 mr-1 inline" />}
            {humanizeAction(entry.action)}
          </Badge>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground font-mono">
          {entry.pool || "—"}
        </TableCell>
        <TableCell className="text-xs text-muted-foreground font-mono">
          {truncatePrincipal(entry.initiator)}
        </TableCell>
        <TableCell
          className={`text-sm text-right font-mono font-semibold ${
            isBurn ? "text-destructive" : "text-primary"
          }`}
        >
          {formatMik97(entry.amount)}
        </TableCell>
        {entry.rewardsEarned > 0 ? (
          <TableCell className="text-xs text-right font-mono text-emerald-500">
            +{formatMik97(entry.rewardsEarned)}
          </TableCell>
        ) : (
          <TableCell />
        )}
        <TableCell>
          <Badge
            variant="outline"
            className={`text-xs ${txTypeBadgeClass(entry.txType)}`}
          >
            {entry.txType === "admin_action"
              ? "Admin"
              : entry.txType === "user_action"
                ? "User"
                : entry.txType === "system_action"
                  ? "System"
                  : "Legacy"}
          </Badge>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="border-border bg-muted/10">
          <TableCell colSpan={8} className="px-4 pb-4 pt-2">
            <div className="rounded-lg border border-border bg-card p-4 space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-muted-foreground uppercase tracking-wide text-[10px]">
                    Transaction ID
                  </p>
                  <p className="font-mono text-foreground">#{entry.txId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground uppercase tracking-wide text-[10px]">
                    Type
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-xs ${txTypeBadgeClass(entry.txType)}`}
                  >
                    {entry.txType}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground uppercase tracking-wide text-[10px]">
                    Exact Timestamp (UTC)
                  </p>
                  <p className="font-mono text-foreground">
                    {formatFullTimestamp(entry.timestamp)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground uppercase tracking-wide text-[10px]">
                    Action
                  </p>
                  <p className="font-mono text-foreground">{entry.action}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground uppercase tracking-wide text-[10px]">
                    Pool
                  </p>
                  <p className="font-mono text-foreground">
                    {entry.pool || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground uppercase tracking-wide text-[10px]">
                    Amount
                  </p>
                  <p
                    className={`font-mono font-semibold ${
                      isBurn ? "text-destructive" : "text-primary"
                    }`}
                  >
                    {formatMik97(entry.amount)} MIK97
                  </p>
                </div>
                {entry.rewardsEarned > 0 && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground uppercase tracking-wide text-[10px]">
                      Staking Rewards Earned
                    </p>
                    <p className="font-mono text-emerald-500 font-semibold">
                      +{formatMik97(entry.rewardsEarned)} MIK97
                    </p>
                  </div>
                )}
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-muted-foreground uppercase tracking-wide text-[10px]">
                    Initiator (Full Principal)
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-foreground break-all">
                      {entry.initiator}
                    </p>
                    {entry.initiator && entry.initiator !== "—" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void navigator.clipboard
                            .writeText(entry.initiator)
                            .then(() => toast.success("Principal copied!"));
                        }}
                        className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                        aria-label="Copy principal"
                        data-ocid="ledger.tx.copy_principal_button"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TransactionLedgerPanel() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [txTypeFilter, setTxTypeFilter] =
    useState<TransactionLedgerFilters["txTypeFilter"]>("all");
  const [poolFilter, setPoolFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(0);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  // (page reset is handled inline in each filter change handler — avoids biome useExhaustiveDependencies)

  const filters: TransactionLedgerFilters = useMemo(
    () => ({
      searchQuery: debouncedSearch,
      txTypeFilter,
      poolFilter,
      startDate,
      endDate,
    }),
    [debouncedSearch, txTypeFilter, poolFilter, startDate, endDate],
  );

  const offset = page * ROWS_PER_PAGE;
  const {
    data: entries,
    isLoading,
    refetch,
  } = useGetTransactionLedger(filters, ROWS_PER_PAGE, offset);
  const { data: totalCount = 0 } = useGetTransactionLedgerCount(filters);
  const { data: burnStats } = useGetBurnStats();

  const totalPages = Math.max(1, Math.ceil(totalCount / ROWS_PER_PAGE));
  const startRow = totalCount === 0 ? 0 : offset + 1;
  const endRow = Math.min(offset + ROWS_PER_PAGE, totalCount);

  const globalTotalBurned = burnStats?.totalBurned ?? null;

  // CSV export
  const handleExportCsv = useCallback(async () => {
    if (!entries || entries.length === 0) {
      toast.error("No transactions to export.");
      return;
    }
    const header = [
      "txId",
      "timestamp_utc",
      "action",
      "pool",
      "initiator",
      "amount_mik97",
      "rewards_earned",
      "tx_type",
    ];
    const rows = entries.map((e) => [
      e.txId,
      formatFullTimestamp(e.timestamp),
      e.action,
      e.pool,
      e.initiator,
      formatMik97(e.amount),
      formatMik97(e.rewardsEarned),
      e.txType,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mikupbeats_transactions_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${entries.length} transactions as CSV.`);
  }, [entries]);

  const TYPE_TABS: {
    value: TransactionLedgerFilters["txTypeFilter"];
    label: string;
  }[] = [
    { value: "all", label: "All Transactions" },
    { value: "admin_action", label: "Admin Actions" },
    { value: "user_action", label: "User Actions" },
    { value: "system_action", label: "System & Burns" },
  ];

  return (
    <Card
      className="bg-card border-border"
      data-ocid="treasury.transaction_ledger_card"
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <CardTitle className="text-primary flex items-center gap-2 text-xl">
              Transaction Ledger
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Blockchain-level transparency — every admin, user, and system
              transaction, including all burns.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {globalTotalBurned !== null && globalTotalBurned > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5">
                <Flame className="h-3.5 w-3.5 text-destructive" />
                <span className="text-xs font-semibold text-destructive">
                  Total Burned (All Time): {formatMik97(globalTotalBurned)}{" "}
                  MIK97
                </span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="h-8 text-xs"
              data-ocid="ledger.export_csv_button"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              className="h-8 text-xs"
              data-ocid="ledger.refresh_button"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Combined search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by action, pool, or address…"
            className="pl-9 bg-background border-input"
            data-ocid="ledger.search_input"
          />
        </div>

        {/* Type filter tabs */}
        <div
          className="flex flex-wrap gap-2"
          data-ocid="ledger.type_filter_tabs"
        >
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setTxTypeFilter(tab.value);
                setPage(0);
              }}
              className={`rounded-full border px-3.5 py-1 text-xs font-semibold transition-colors ${
                txTypeFilter === tab.value
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
              data-ocid={`ledger.type_tab.${tab.value}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date range + pool filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="space-y-1">
            <label
              htmlFor="ledger-start-date"
              className="text-xs text-muted-foreground"
            >
              Start Date
            </label>
            <input
              id="ledger-start-date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(0);
              }}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              data-ocid="ledger.start_date_input"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="ledger-end-date"
              className="text-xs text-muted-foreground"
            >
              End Date
            </label>
            <input
              id="ledger-end-date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(0);
              }}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              data-ocid="ledger.end_date_input"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="ledger-pool-filter"
              className="text-xs text-muted-foreground"
            >
              Pool
            </label>
            <select
              id="ledger-pool-filter"
              value={poolFilter}
              onChange={(e) => {
                setPoolFilter(e.target.value);
                setPage(0);
              }}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              data-ocid="ledger.pool_filter_select"
            >
              {POOL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2" data-ocid="ledger.loading_state">
            {["sk1", "sk2", "sk3", "sk4", "sk5", "sk6", "sk7", "sk8"].map(
              (k) => (
                <Skeleton key={k} className="h-10 w-full rounded-md" />
              ),
            )}
          </div>
        ) : !entries || entries.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground space-y-2"
            data-ocid="ledger.empty_state"
          >
            <Search className="h-8 w-8 mx-auto opacity-30" />
            <p className="text-sm font-medium">
              No transactions found matching your filters.
            </p>
            {(searchInput || poolFilter !== "all" || startDate || endDate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchInput("");
                  setDebouncedSearch("");
                  setPoolFilter("all");
                  setStartDate("");
                  setEndDate("");
                  setTxTypeFilter("all");
                }}
                data-ocid="ledger.clear_filters_button"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-muted/20">
                  <TableHead className="text-muted-foreground text-xs w-14">
                    #
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs whitespace-nowrap">
                    Time (UTC)
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
                  <TableHead className="text-muted-foreground text-xs text-right whitespace-nowrap">
                    Rewards Earned
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs">
                    Type
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, i) => (
                  <TxRow key={`${entry.txId}-${i}`} entry={entry} index={i} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalCount > 0 && (
          <div
            className="flex items-center justify-between gap-4 flex-wrap"
            data-ocid="ledger.pagination"
          >
            <p className="text-xs text-muted-foreground">
              Showing {startRow}–{endRow} of {totalCount.toLocaleString()}{" "}
              transactions
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                data-ocid="ledger.pagination_prev"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-foreground font-mono">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                data-ocid="ledger.pagination_next"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
