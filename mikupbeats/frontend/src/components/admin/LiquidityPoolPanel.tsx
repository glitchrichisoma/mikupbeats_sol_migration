import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  ExternalLink,
  Lock,
  RefreshCw,
  Rocket,
  Unlock,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useGetLiquidityDeploymentLog,
  useGetLiquidityPoolStatus,
  useInitiateLiquidityDeployment,
  useLockLiquidityPool,
  useSetLiquidityDeploymentStatus,
  useUnlockLiquidityPool,
} from "../../hooks/useQueries";
import type { LiquidityDeploymentLogEntry } from "../../types/treasury";

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (n === 0) return "0";
  // Show as integer if whole, else up to 8 dp trimmed
  return n % 1 === 0
    ? n.toLocaleString()
    : Number.parseFloat(n.toFixed(8)).toLocaleString();
}

function tsToDate(ts: bigint): string {
  try {
    // Nanosecond timestamp → milliseconds
    const ms = Number(ts / 1_000_000n);
    if (ms < 1_000_000) return "—";
    return new Date(ms).toLocaleString();
  } catch {
    return "—";
  }
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ready_for_deployment":
      return (
        <Badge
          variant="outline"
          className="border-yellow-500 text-yellow-400 bg-yellow-500/10"
        >
          Ready for Deployment
        </Badge>
      );
    case "deployed":
      return (
        <Badge
          variant="outline"
          className="border-emerald-500 text-emerald-400 bg-emerald-500/10"
        >
          ✓ Deployed
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="border-red-500 text-red-400 bg-red-500/10"
        >
          <Lock className="h-3 w-3 mr-1" />
          Locked
        </Badge>
      );
  }
}

// ── Deployment Step Flow ──────────────────────────────────────────────────────

type DeployStep = 1 | 2 | 3;

function getStep(status: string): DeployStep {
  if (status === "deployed") return 3;
  if (status === "ready_for_deployment") return 2;
  return 1;
}

function DeploymentSteps({ currentStep }: { currentStep: DeployStep }) {
  const steps = [
    { n: 1, label: "Pool Locked", sub: "Protected — no deployment possible" },
    {
      n: 2,
      label: "Pool Unlocked",
      sub: "Ready — deployment can be initiated",
    },
    { n: 3, label: "Deployed", sub: "Tokens sent for exchange listing" },
  ];
  return (
    <div className="flex gap-2 items-start">
      {steps.map(({ n, label, sub }, idx) => {
        const isActive = n === currentStep;
        const isDone = n < currentStep;
        return (
          <div key={n} className="flex-1 relative">
            <div
              className={`rounded-lg border p-3 text-center ${
                isActive
                  ? "border-primary bg-primary/10"
                  : isDone
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-border bg-muted/10"
              }`}
            >
              <div
                className={`text-lg font-bold ${
                  isActive
                    ? "text-primary"
                    : isDone
                      ? "text-emerald-400"
                      : "text-muted-foreground/40"
                }`}
              >
                {isDone ? "✓" : n}
              </div>
              <p
                className={`text-xs font-medium mt-0.5 ${
                  isActive
                    ? "text-foreground"
                    : isDone
                      ? "text-emerald-400"
                      : "text-muted-foreground/50"
                }`}
              >
                {label}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-0.5 leading-tight">
                {sub}
              </p>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`absolute top-5 right-0 w-2 h-px translate-x-1 ${
                  n < currentStep ? "bg-emerald-500" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Deployment Log ────────────────────────────────────────────────────────────

function DeploymentLog() {
  const {
    data: log = [],
    refetch,
    isFetching,
  } = useGetLiquidityDeploymentLog();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
          onClick={() => setExpanded((v) => !v)}
          data-ocid="treasury.liquidity_pool.log_toggle"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          Deployment Log ({log.length})
        </button>
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => void refetch()}
          disabled={isFetching}
          data-ocid="treasury.liquidity_pool.log_refresh"
        >
          <RefreshCw
            className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {expanded && (
        <div className="rounded-lg border border-border overflow-hidden">
          {log.length === 0 ? (
            <div
              className="px-4 py-8 text-center text-sm text-muted-foreground"
              data-ocid="treasury.liquidity_pool.log_empty_state"
            >
              No deployments yet.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">
                    Date / Time
                  </th>
                  <th className="text-right px-4 py-2 text-muted-foreground font-medium">
                    Amount (MIK97)
                  </th>
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">
                    Destination Note
                  </th>
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">
                    Deployed By
                  </th>
                </tr>
              </thead>
              <tbody>
                {(log as LiquidityDeploymentLogEntry[]).map((entry, i) => (
                  <tr
                    key={entry.id}
                    className={`border-b border-border last:border-0 ${
                      i % 2 === 0 ? "bg-background" : "bg-muted/10"
                    }`}
                    data-ocid={`treasury.liquidity_pool.log_item.${i + 1}`}
                  >
                    <td className="px-4 py-2 text-muted-foreground">
                      {tsToDate(entry.timestamp)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-foreground">
                      {fmt(entry.amount)}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground max-w-xs truncate">
                      {entry.destinationNote || (
                        <span className="italic opacity-50">No note</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {entry.deployedBy || "admin"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function LiquidityPoolPanel() {
  const { data: lpStatus, refetch: refetchLp } = useGetLiquidityPoolStatus();
  const setStatus = useSetLiquidityDeploymentStatus();
  const lockPool = useLockLiquidityPool();
  const unlockPool = useUnlockLiquidityPool();
  const initiateDeploy = useInitiateLiquidityDeployment();

  const [unlockNote, setUnlockNote] = useState("");
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  const [deployAmount, setDeployAmount] = useState("");
  const [deployNote, setDeployNote] = useState("");
  const [showDeployConfirm, setShowDeployConfirm] = useState(false);
  const [actionMsg, setActionMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const currentStatus = lpStatus?.deploymentStatus ?? "locked";
  const balance = lpStatus?.balance ?? 0;
  const ceiling = lpStatus?.ceiling ?? 10_000_000;
  const pct = lpStatus?.percentRemaining ?? 100;
  const step = getStep(currentStatus);
  const isLocked = currentStatus === "locked";
  const isReady = currentStatus === "ready_for_deployment";
  const isDeployed = currentStatus === "deployed";

  function handleLock() {
    setActionMsg(null);
    lockPool.mutate(undefined, {
      onSuccess: () => {
        setActionMsg({ type: "ok", text: "Pool locked successfully." });
        toast.success("Liquidity pool locked.");
        void refetchLp();
      },
      onError: (e) => {
        const msg = e.message || "Lock failed.";
        setActionMsg({ type: "err", text: msg });
        toast.error(msg);
      },
    });
  }

  function handleUnlock() {
    setShowUnlockConfirm(false);
    setActionMsg(null);
    unlockPool.mutate(unlockNote, {
      onSuccess: () => {
        setActionMsg({
          type: "ok",
          text: "Pool unlocked — ready for deployment.",
        });
        toast.success("Liquidity pool unlocked.");
        setUnlockNote("");
        void refetchLp();
      },
      onError: (e) => {
        const msg = e.message || "Unlock failed.";
        setActionMsg({ type: "err", text: msg });
        toast.error(msg);
      },
    });
  }

  function handleDeploy() {
    setShowDeployConfirm(false);
    const amt = Number.parseFloat(deployAmount);
    if (Number.isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid deployment amount.");
      return;
    }
    if (amt > balance) {
      toast.error(`Amount exceeds available balance (${fmt(balance)} MIK97).`);
      return;
    }
    setActionMsg(null);
    initiateDeploy.mutate(
      { amount: amt, destinationNote: deployNote },
      {
        onSuccess: () => {
          setActionMsg({
            type: "ok",
            text: `Deployment of ${fmt(amt)} MIK97 initiated and logged.`,
          });
          toast.success("Deployment initiated.");
          setDeployAmount("");
          setDeployNote("");
          void refetchLp();
        },
        onError: (e) => {
          const msg = e.message || "Deployment failed.";
          setActionMsg({ type: "err", text: msg });
          toast.error(msg);
        },
      },
    );
  }

  const isBusy =
    lockPool.isPending ||
    unlockPool.isPending ||
    initiateDeploy.isPending ||
    setStatus.isPending;

  return (
    <Card
      className="bg-card border-border"
      data-ocid="treasury.liquidity_pool_card"
    >
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Database className="h-5 w-5" />
          Liquidity Pool — Exchange Deployment
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          These 10M MIK97 tokens are reserved for ICPSwap exchange listing.
          After on-chain migration, deploy these tokens alongside ICP to create
          the trading pair and establish market price.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balance Overview */}
        <div className="rounded-lg border border-border bg-muted/20 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              Liquidity Pool Balance
            </p>
            <p className="text-3xl font-bold text-foreground font-mono">
              {fmt(balance)}
              <span className="text-base font-normal text-muted-foreground ml-2">
                MIK97
              </span>
            </p>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-40 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {pct.toFixed(1)}% of {fmt(ceiling)} ceiling remaining
              </span>
            </div>
          </div>
          <StatusBadge status={currentStatus} />
        </div>

        {/* Deployment Step Flow */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            Deployment Status
          </Label>
          <DeploymentSteps currentStep={step} />
        </div>

        {/* Pool Lock Section */}
        <div
          className="rounded-lg border border-border p-4 space-y-3"
          data-ocid="treasury.liquidity_pool.lock_section"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                {isLocked ? (
                  <>
                    <Lock className="h-4 w-4 text-red-400" /> Pool is Locked
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 text-yellow-400" /> Pool is
                    Unlocked
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLocked
                  ? "Tokens are protected. Unlock only when ready for exchange listing."
                  : "Pool is unlocked — deployment can be initiated below."}
              </p>
            </div>
            {isDeployed ? (
              <Badge
                variant="outline"
                className="border-emerald-500 text-emerald-400"
              >
                Deployment Complete
              </Badge>
            ) : isLocked ? (
              <Button
                variant="outline"
                size="sm"
                className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                disabled={isBusy}
                onClick={() => setShowUnlockConfirm(true)}
                data-ocid="treasury.liquidity_pool.unlock_button"
              >
                <Unlock className="h-3.5 w-3.5 mr-1.5" />
                Unlock Pool
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="border-red-500 text-red-400 hover:bg-red-500/10"
                disabled={isBusy}
                onClick={handleLock}
                data-ocid="treasury.liquidity_pool.lock_button"
              >
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                Lock Pool
              </Button>
            )}
          </div>

          {/* Unlock confirmation inline */}
          {showUnlockConfirm && (
            <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 space-y-3">
              <p className="text-xs text-yellow-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-yellow-400" />
                <span>
                  <strong>Warning:</strong> This will allow token deployment —
                  only proceed when ready for exchange listing. Add an optional
                  note for the record.
                </span>
              </p>
              <Textarea
                placeholder="Optional note (e.g. planning ICPSwap listing Q3 2025)"
                value={unlockNote}
                onChange={(e) => setUnlockNote(e.target.value)}
                className="bg-background border-input resize-none h-16 text-xs"
                data-ocid="treasury.liquidity_pool.unlock_note_input"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-yellow-500 text-black hover:bg-yellow-400"
                  disabled={isBusy}
                  onClick={handleUnlock}
                  data-ocid="treasury.liquidity_pool.unlock_confirm_button"
                >
                  Confirm Unlock
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border"
                  onClick={() => setShowUnlockConfirm(false)}
                  data-ocid="treasury.liquidity_pool.unlock_cancel_button"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Initiate Deployment Form — only when unlocked and not yet deployed */}
        {isReady && !isDeployed && (
          <div
            className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-4"
            data-ocid="treasury.liquidity_pool.deploy_section"
          >
            <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Rocket className="h-4 w-4 text-primary" />
              Initiate Deployment
            </p>
            <p className="text-xs text-muted-foreground">
              Transfer MIK97 tokens to your admin wallet for ICPSwap pairing.
              Max available:{" "}
              <span className="text-foreground font-mono font-medium">
                {fmt(balance)} MIK97
              </span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Amount to Deploy (MIK97)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={balance}
                  step={1}
                  value={deployAmount}
                  onChange={(e) => setDeployAmount(e.target.value)}
                  placeholder={`Max: ${fmt(balance)}`}
                  className="bg-background border-input"
                  data-ocid="treasury.liquidity_pool.deploy_amount_input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Destination Note (memo)
                </Label>
                <Input
                  type="text"
                  value={deployNote}
                  onChange={(e) => setDeployNote(e.target.value)}
                  placeholder="e.g. ICPSwap MIK97/ICP pair"
                  className="bg-background border-input"
                  data-ocid="treasury.liquidity_pool.deploy_note_input"
                />
              </div>
            </div>

            <Button
              className="bg-primary text-primary-foreground w-full sm:w-auto"
              disabled={isBusy || !deployAmount}
              onClick={() => setShowDeployConfirm(true)}
              data-ocid="treasury.liquidity_pool.deploy_button"
            >
              <Rocket className="h-4 w-4 mr-1.5" />
              Deploy to Admin Wallet
            </Button>

            {/* Deploy confirmation */}
            {showDeployConfirm && (
              <div
                className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 space-y-3"
                data-ocid="treasury.liquidity_pool.deploy_confirm_dialog"
              >
                <p className="text-xs text-red-300 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                  <span>
                    <strong>
                      This will transfer{" "}
                      {fmt(Number.parseFloat(deployAmount) || 0)} MIK97
                    </strong>{" "}
                    to your admin wallet for ICPSwap pairing. This action is
                    logged and cannot be undone.
                  </span>
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isBusy}
                    onClick={handleDeploy}
                    data-ocid="treasury.liquidity_pool.deploy_confirm_button"
                  >
                    Confirm Deployment
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-border"
                    onClick={() => setShowDeployConfirm(false)}
                    data-ocid="treasury.liquidity_pool.deploy_cancel_button"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* How to use — info box */}
        <div className="rounded-lg border border-border bg-muted/10 px-4 py-3 space-y-1.5 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            How to use this pool:
          </p>
          <ol className="space-y-1 list-decimal list-inside">
            <li>Complete on-chain migration from the Migration section</li>
            <li>Unlock this pool when ready to list on ICPSwap</li>
            <li>
              Enter the token amount and destination note, then initiate
              deployment
            </li>
            <li>
              On ICPSwap, create a MIK97/ICP pair using your token canister ID
            </li>
            <li>
              Deposit tokens from this pool + ICP to set the opening price
            </li>
          </ol>
        </div>

        {/* Action result message */}
        {actionMsg && (
          <p
            className={`text-xs flex items-center gap-1 ${
              actionMsg.type === "ok" ? "text-emerald-400" : "text-destructive"
            }`}
            data-ocid={`treasury.liquidity_pool.${
              actionMsg.type === "ok" ? "success_state" : "error_state"
            }`}
          >
            {actionMsg.type === "ok" ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <XCircle className="h-3.5 w-3.5 shrink-0" />
            )}
            {actionMsg.text}
          </p>
        )}

        {/* Deployment Log */}
        <DeploymentLog />
      </CardContent>
    </Card>
  );
}
