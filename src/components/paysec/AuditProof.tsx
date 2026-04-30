import { useState } from "react";
import { usePublicClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import { NOVAPAY_ADDRESS } from "@/lib/contracts";
import { cn } from "@/lib/utils";

interface Props {
  txHash: string;
  className?: string;
}

interface Proof {
  tx: string;
  block: string;
  timestamp: string;
  status: "confirmed" | "failed";
  contract: string;
  network: string;
  verifiedAt: string;
}

export const AuditProof = ({ txHash, className }: Props) => {
  const publicClient = usePublicClient();
  const [generating, setGenerating] = useState(false);
  const [proof, setProof] = useState<Proof | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!publicClient || !txHash || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const [receipt, block] = await Promise.all([
        publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` }),
        publicClient.getBlock({ blockTag: "latest" }),
      ]);
      const receiptBlock = await publicClient.getBlock({
        blockNumber: receipt.blockNumber,
      });

      const p: Proof = {
        tx: txHash,
        block: receipt.blockNumber.toString(),
        timestamp: receiptBlock.timestamp.toString(),
        status: receipt.status === "success" ? "confirmed" : "failed",
        contract: NOVAPAY_ADDRESS,
        network: "arbitrum-sepolia",
        verifiedAt: new Date().toISOString(),
      };

      setProof(p);
      // Encode proof as URL-safe base64 — amount is NOT included
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(p))));
      setProofUrl(`${window.location.origin}/audit?proof=${encoded}`);
    } catch (e) {
      setError("Could not fetch receipt. Check your RPC connection.");
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!proofUrl) return;
    await navigator.clipboard.writeText(proofUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {!proof ? (
        <>
          <Button
            onClick={generate}
            disabled={generating}
            variant="outline"
            className="h-9 rounded-full border-accent/40 bg-background px-4 text-xs font-semibold text-foreground shadow-soft hover:border-accent hover:bg-accent-soft"
          >
            {generating ? (
              <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Generating…</>
            ) : (
              <><ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-accent" /> Generate Audit Proof</>
            )}
          </Button>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </>
      ) : (
        <div className="rounded-xl border border-accent/25 bg-accent-soft p-4 space-y-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            Payment confirmed — amount sealed
          </p>

          <div className="grid grid-cols-2 gap-2 rounded-lg bg-background/60 p-3 text-[11px]">
            <div>
              <p className="uppercase tracking-wider text-muted-foreground">Block</p>
              <p className="font-mono mt-0.5">{proof.block}</p>
            </div>
            <div>
              <p className="uppercase tracking-wider text-muted-foreground">Status</p>
              <p className="font-mono mt-0.5 text-accent">{proof.status}</p>
            </div>
            <div className="col-span-2">
              <p className="uppercase tracking-wider text-muted-foreground">Timestamp</p>
              <p className="font-mono mt-0.5">
                {new Date(Number(proof.timestamp) * 1000).toLocaleString()}
              </p>
            </div>
          </div>

          <p className="font-mono text-[10px] text-muted-foreground truncate">{proofUrl}</p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-card px-3 py-1 text-[11px] font-semibold text-muted-foreground shadow-soft transition-colors hover:text-foreground"
            >
              {copied ? (
                <><Check className="h-3 w-3 text-accent" /> Copied!</>
              ) : (
                <><Copy className="h-3 w-3" /> Copy proof link</>
              )}
            </button>
            <a
              href={`https://sepolia.arbiscan.io/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-card px-3 py-1 text-[11px] font-semibold text-muted-foreground shadow-soft transition-colors hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" /> Verify on-chain
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
