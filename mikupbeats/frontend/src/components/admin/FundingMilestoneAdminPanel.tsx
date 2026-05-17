import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Eye,
  EyeOff,
  Target,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useGetFundingMilestone,
  useMarkMilestoneReached,
  useSetFundingGoal,
  useSetFundingMilestoneVisible,
  useUpdateFundingAmount,
} from "../../hooks/useQueries";

function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function FundingMilestoneAdminPanel() {
  const { data: milestone, isLoading, refetch } = useGetFundingMilestone();
  // isVisible comes directly from the milestone object (backend field + localStorage fallback)
  const isVisible = milestone?.isVisible ?? false;
  const setGoal = useSetFundingGoal();
  const updateAmount = useUpdateFundingAmount();
  const markReached = useMarkMilestoneReached();
  const setVisible = useSetFundingMilestoneVisible();

  const [goalInput, setGoalInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [goalMsg, setGoalMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [amountMsg, setAmountMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [showMarkConfirm, setShowMarkConfirm] = useState(false);

  function handleSetGoal() {
    const val = Number.parseFloat(goalInput);
    if (!Number.isFinite(val) || val <= 0) {
      setGoalMsg({ type: "err", text: "Enter a valid goal amount." });
      return;
    }
    setGoalMsg(null);
    setGoal.mutate(val, {
      onSuccess: () => {
        setGoalMsg({
          type: "ok",
          text: `Funding goal updated to ${formatUsd(val)}.`,
        });
        toast.success("Funding goal updated.");
        setGoalInput("");
        void refetch();
      },
      onError: (e) => {
        const msg = e.message || "Failed to update goal.";
        setGoalMsg({ type: "err", text: msg });
        toast.error(msg);
      },
    });
  }

  function handleUpdateAmount() {
    const val = Number.parseFloat(amountInput);
    if (!Number.isFinite(val) || val < 0) {
      setAmountMsg({ type: "err", text: "Enter a valid funding amount." });
      return;
    }
    setAmountMsg(null);
    updateAmount.mutate(val, {
      onSuccess: () => {
        setAmountMsg({
          type: "ok",
          text: `Current funding updated to ${formatUsd(val)}.`,
        });
        toast.success("Funding amount updated.");
        setAmountInput("");
        void refetch();
      },
      onError: (e) => {
        const msg = e.message || "Failed to update amount.";
        setAmountMsg({ type: "err", text: msg });
        toast.error(msg);
      },
    });
  }

  function handleToggleVisibility(v: boolean) {
    setVisible.mutate(v, {
      onSuccess: () => {
        toast.success(
          v
            ? "Funding milestone is now visible on public pages."
            : "Funding milestone hidden from public pages.",
        );
        void refetch();
      },
      onError: (e) => toast.error(e.message || "Failed to update visibility."),
    });
  }

  if (isLoading) {
    return <div className="animate-pulse h-48 rounded-lg bg-muted/30" />;
  }

  const pct = Math.min(milestone?.percentage ?? 0, 100);
  const progressColor =
    pct >= 100 ? "bg-green-500" : pct >= 50 ? "bg-primary" : "bg-primary/60";

  return (
    <Card
      className="bg-card border-border"
      data-ocid="treasury.funding_milestone_card"
    >
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Target className="h-5 w-5" />
          Funding Milestone
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Track platform funding progress. When the goal is reached, MIK97
          launches on the blockchain as a real tradeable token. Update the goal
          and current funding amount here as real funding comes in.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* ── Visibility Toggle ── */}
        <div
          className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3"
          data-ocid="treasury.funding_milestone.visibility_row"
        >
          <div className="flex items-center gap-2">
            {isVisible ? (
              <Eye className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">
                Show on Public Pages
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isVisible
                  ? "Banner is visible on the Store page"
                  : "Banner is hidden from all public pages"}
              </p>
            </div>
          </div>
          <Switch
            checked={!!isVisible}
            onCheckedChange={handleToggleVisibility}
            disabled={setVisible.isPending}
            data-ocid="treasury.funding_milestone.visibility_toggle"
          />
        </div>

        {/* Current status overview */}
        {milestone && (
          <div className="rounded-lg border border-border bg-muted/20 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Current Status
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-foreground font-mono">
                    {formatUsd(milestone.current)}
                  </p>
                  <span className="text-muted-foreground text-sm">
                    / {formatUsd(milestone.goal)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <Badge
                  variant="outline"
                  className={`text-xs ${milestone.reached ? "border-green-500 text-green-500" : "border-primary/40 text-primary"}`}
                  data-ocid="treasury.funding_milestone.status_badge"
                >
                  {milestone.reached
                    ? "Milestone Reached!"
                    : `${pct.toFixed(1)}% funded`}
                </Badge>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progressColor}`}
                style={{ width: `${pct}%` }}
                data-ocid="treasury.funding_milestone.progress_bar"
              />
            </div>
            {milestone.reached && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Milestone achieved — MIK97 is going on-chain!
              </div>
            )}
          </div>
        )}

        {/* Update goal */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Update Funding Goal
          </h4>
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                New goal amount (USD)
              </Label>
              <Input
                type="number"
                min={0}
                step="1000"
                placeholder="e.g. 10000000"
                value={goalInput}
                onChange={(e) => {
                  setGoalInput(e.target.value);
                  setGoalMsg(null);
                }}
                className="bg-background border-input"
                data-ocid="treasury.funding_milestone.goal_input"
              />
            </div>
            <Button
              onClick={handleSetGoal}
              disabled={setGoal.isPending || !goalInput}
              className="bg-primary text-primary-foreground shrink-0"
              data-ocid="treasury.funding_milestone.update_goal_button"
            >
              {setGoal.isPending ? "Updating…" : "Update Goal"}
            </Button>
          </div>
          {goalMsg && (
            <p
              className={`text-xs flex items-center gap-1 ${goalMsg.type === "ok" ? "text-emerald-500" : "text-destructive"}`}
              data-ocid={`treasury.funding_milestone.goal.${goalMsg.type === "ok" ? "success_state" : "error_state"}`}
            >
              {goalMsg.type === "ok" ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 shrink-0" />
              )}
              {goalMsg.text}
            </p>
          )}
        </div>

        {/* Update current funding */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Update Current Funding
          </h4>
          <p className="text-xs text-muted-foreground">
            Manually update as real funding comes in from sales, sponsors, or
            other sources.
          </p>
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Current funding amount (USD)
              </Label>
              <Input
                type="number"
                min={0}
                step="100"
                placeholder="e.g. 500000"
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  setAmountMsg(null);
                }}
                className="bg-background border-input"
                data-ocid="treasury.funding_milestone.amount_input"
              />
            </div>
            <Button
              onClick={handleUpdateAmount}
              disabled={updateAmount.isPending || !amountInput}
              className="bg-primary text-primary-foreground shrink-0"
              data-ocid="treasury.funding_milestone.update_amount_button"
            >
              {updateAmount.isPending ? "Updating…" : "Update Funding"}
            </Button>
          </div>
          {amountMsg && (
            <p
              className={`text-xs flex items-center gap-1 ${amountMsg.type === "ok" ? "text-emerald-500" : "text-destructive"}`}
              data-ocid={`treasury.funding_milestone.amount.${amountMsg.type === "ok" ? "success_state" : "error_state"}`}
            >
              {amountMsg.type === "ok" ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 shrink-0" />
              )}
              {amountMsg.text}
            </p>
          )}
        </div>

        {/* Mark milestone reached */}
        {milestone && !milestone.reached && (
          <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/5 px-4 py-3 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
              <p className="text-sm font-semibold text-yellow-400">
                Mark Milestone as Reached
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              This publicly announces that the funding milestone has been
              achieved. A celebratory banner will appear on the platform and
              MIK97 on-chain launch will be indicated as confirmed.
            </p>
            {!showMarkConfirm ? (
              <Button
                variant="outline"
                size="sm"
                className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                onClick={() => setShowMarkConfirm(true)}
                data-ocid="treasury.funding_milestone.mark_reached_button"
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Mark Milestone Reached
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border text-foreground"
                  onClick={() => setShowMarkConfirm(false)}
                  data-ocid="treasury.funding_milestone.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-green-500 text-white hover:bg-green-400"
                  disabled={markReached.isPending}
                  onClick={() => {
                    markReached.mutate(undefined, {
                      onSuccess: () => {
                        toast.success(
                          "Milestone marked as reached! MIK97 is going on-chain.",
                        );
                        setShowMarkConfirm(false);
                        void refetch();
                      },
                      onError: (e) =>
                        toast.error(e.message || "Failed to mark milestone."),
                    });
                  }}
                  data-ocid="treasury.funding_milestone.confirm_reached_button"
                >
                  {markReached.isPending
                    ? "Processing…"
                    : "Confirm — Milestone Reached!"}
                </Button>
              </div>
            )}
          </div>
        )}

        {milestone?.reached && (
          <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            <p className="text-sm text-green-400 font-semibold">
              Milestone reached — MIK97 launch is confirmed!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
