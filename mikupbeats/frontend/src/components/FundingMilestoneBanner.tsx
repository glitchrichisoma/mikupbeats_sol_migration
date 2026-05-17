import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Target } from "lucide-react";
import {
  useGetFundingMilestone,
  useGetFundingMilestoneVisible,
} from "../hooks/useQueries";

function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function FundingMilestoneBanner() {
  const { data: milestone } = useGetFundingMilestone();
  const { data: isVisible } = useGetFundingMilestoneVisible();

  // If visibility flag is explicitly false, render nothing
  if (isVisible === false) return null;
  if (!milestone) return null;

  const pct = Math.min(milestone.percentage, 100);
  const progressColor =
    pct >= 100 ? "bg-green-500" : pct >= 50 ? "bg-primary" : "bg-primary/70";

  if (milestone.reached) {
    return (
      <Card
        className="bg-card border-green-500/40 border-2"
        data-ocid="funding_milestone.banner"
      >
        <CardContent className="pt-4 pb-4 flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-400">
              Milestone Reached! MIK97 is going on-chain.
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              The {formatUsd(milestone.goal)} funding goal has been achieved.
              MIK97 is launching as a real tradeable blockchain token.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-green-500 text-green-500 shrink-0 ml-auto"
          >
            100% Funded
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="bg-card border-border"
      data-ocid="funding_milestone.banner"
    >
      <CardContent className="pt-4 pb-4 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-semibold text-foreground">
              Platform Funding Goal
            </span>
          </div>
          <Badge
            variant="outline"
            className="border-primary/40 text-primary text-xs shrink-0"
          >
            {pct.toFixed(1)}% funded
          </Badge>
        </div>

        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${progressColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Current:{" "}
            <span className="text-foreground font-semibold">
              {formatUsd(milestone.current)}
            </span>
          </span>
          <span>
            Goal:{" "}
            <span className="text-foreground font-semibold">
              {formatUsd(milestone.goal)}
            </span>
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          When this goal is reached, MIK97 will launch on the blockchain as a
          real tradeable token. Until then it's a platform rewards token —{" "}
          <span className="text-foreground font-medium">
            100 MIK97 = $1 off
          </span>{" "}
          your purchases.
        </p>
      </CardContent>
    </Card>
  );
}
