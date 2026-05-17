import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Minus, Plus, Send, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAirdropFromPromotions,
  useGetPoolDetails,
} from "../../hooks/useQueries";

function formatMik97(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "0";
  return n
    .toFixed(8)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
}

interface Recipient {
  id: number;
  address: string;
  amount: string;
}

interface AirdropResult {
  address: string;
  result: string;
}

export default function AirdropTool() {
  const { data: poolDetails } = useGetPoolDetails();
  const airdrop = useAirdropFromPromotions();

  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: 1, address: "", amount: "" },
  ]);
  const [results, setResults] = useState<AirdropResult[] | null>(null);
  const [nextId, setNextId] = useState(2);

  const promotionsBalance =
    Array.isArray(poolDetails) && poolDetails.length > 0
      ? (poolDetails.find(
          (p) =>
            p.poolName.toLowerCase() === "promotions" ||
            p.poolName.toLowerCase() === "promotions pool",
        )?.currentBalance ?? 0)
      : 0;

  const totalToDistribute = recipients.reduce((sum, r) => {
    const amt = Number.parseFloat(r.amount);
    return sum + (Number.isFinite(amt) ? amt : 0);
  }, 0);

  function addRecipient() {
    if (recipients.length >= 50) return;
    setRecipients((prev) => [...prev, { id: nextId, address: "", amount: "" }]);
    setNextId((n) => n + 1);
  }

  function removeRecipient(id: number) {
    if (recipients.length === 1) return;
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRecipient(
    id: number,
    field: "address" | "amount",
    value: string,
  ) {
    setRecipients((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
    setResults(null);
  }

  function handleDistribute() {
    const valid = recipients.filter((r) => {
      const amt = Number.parseFloat(r.amount);
      return r.address.trim() && Number.isFinite(amt) && amt > 0;
    });

    if (valid.length === 0) {
      toast.error(
        "Add at least one recipient with a valid address and amount.",
      );
      return;
    }

    setResults(null);
    airdrop.mutate(
      valid.map((r) => ({
        address: r.address.trim(),
        amount: Number.parseFloat(r.amount),
      })),
      {
        onSuccess: (res) => {
          const airdropResults: AirdropResult[] = (
            res as Array<[string, string]>
          ).map(([address, result]) => ({ address, result }));
          setResults(airdropResults);
          const succeeded = airdropResults.filter(
            (r) =>
              r.result.toLowerCase().includes("ok") ||
              r.result.toLowerCase().includes("success"),
          ).length;
          toast.success(
            `Airdrop complete: ${succeeded}/${airdropResults.length} recipients received tokens.`,
          );
        },
        onError: (e) => {
          toast.error(`Airdrop failed: ${e.message || "Please try again."}`);
        },
      },
    );
  }

  return (
    <Card className="bg-card border-border" data-ocid="treasury.airdrop_card">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Send className="h-5 w-5" />
          Promotions Airdrop Tool
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Distribute MIK97 tokens directly from the Promotions pool to multiple
          wallets at once. Use for contests, campaigns, and community rewards.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Pool balance */}
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Promotions Pool Balance
          </span>
          <span
            className="text-sm font-bold text-foreground font-mono"
            data-ocid="treasury.airdrop.pool_balance"
          >
            {formatMik97(promotionsBalance)} MIK97
          </span>
        </div>

        {/* Recipients list */}
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_120px_32px] gap-2 px-1">
            <Label className="text-xs text-muted-foreground">
              Wallet Address / Principal
            </Label>
            <Label className="text-xs text-muted-foreground">Amount</Label>
            <span />
          </div>
          {recipients.map((r, i) => (
            <div
              key={r.id}
              className="grid grid-cols-[1fr_120px_32px] gap-2 items-center"
              data-ocid={`treasury.airdrop.recipient.${i + 1}`}
            >
              <Input
                type="text"
                placeholder="e.g. aaaaa-aa or full principal"
                value={r.address}
                onChange={(e) =>
                  updateRecipient(r.id, "address", e.target.value)
                }
                className="bg-background border-input text-xs font-mono h-8"
                data-ocid={`treasury.airdrop.address_input.${i + 1}`}
              />
              <Input
                type="number"
                min={0}
                step="0.00000001"
                placeholder="0.00"
                value={r.amount}
                onChange={(e) =>
                  updateRecipient(r.id, "amount", e.target.value)
                }
                className="bg-background border-input text-xs h-8"
                data-ocid={`treasury.airdrop.amount_input.${i + 1}`}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 border-border text-muted-foreground hover:text-destructive hover:border-destructive"
                onClick={() => removeRecipient(r.id)}
                disabled={recipients.length === 1}
                data-ocid={`treasury.airdrop.remove_button.${i + 1}`}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add recipient + total */}
        <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRecipient}
            disabled={recipients.length >= 50}
            className="border-border text-foreground"
            data-ocid="treasury.airdrop.add_recipient_button"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Recipient
          </Button>
          <div className="text-xs text-muted-foreground text-right">
            Total to distribute:{" "}
            <span className="text-foreground font-semibold font-mono">
              {formatMik97(totalToDistribute)} MIK97
            </span>
            {totalToDistribute > promotionsBalance && (
              <span className="ml-2 text-destructive font-semibold">
                (exceeds pool balance!)
              </span>
            )}
          </div>
        </div>

        <Button
          onClick={handleDistribute}
          disabled={
            airdrop.isPending ||
            recipients.every((r) => !r.address.trim() || !r.amount)
          }
          className="bg-primary text-primary-foreground w-full sm:w-auto"
          data-ocid="treasury.airdrop.distribute_button"
        >
          <Send className="h-4 w-4 mr-2" />
          {airdrop.isPending
            ? "Distributing…"
            : `Distribute to ${recipients.filter((r) => r.address.trim() && r.amount).length} recipient(s)`}
        </Button>

        {/* Results */}
        {results && results.length > 0 && (
          <div className="space-y-1.5" data-ocid="treasury.airdrop.results">
            <p className="text-xs font-semibold text-foreground">
              Distribution Results:
            </p>
            {results.map((res, i) => {
              const ok =
                res.result.toLowerCase().includes("ok") ||
                res.result.toLowerCase().includes("success");
              return (
                <div
                  key={`${res.address}-${i}`}
                  className="flex items-center gap-2 text-xs"
                  data-ocid={`treasury.airdrop.result.${i + 1}`}
                >
                  {ok ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  )}
                  <span className="font-mono text-muted-foreground truncate max-w-[160px]">
                    {res.address.slice(0, 14)}…
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 ${ok ? "border-emerald-500 text-emerald-500" : "border-destructive text-destructive"}`}
                  >
                    {ok ? "Success" : res.result}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
