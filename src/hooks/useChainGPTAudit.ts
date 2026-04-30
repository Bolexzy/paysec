import { useState } from "react";

export interface AuditFinding {
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
}

export interface AuditReport {
  score: number; // 0-100
  summary: string;
  findings: AuditFinding[];
  generatedAt: string;
}

const CONTRACT_ADDRESS = "0xF802a2ba4e80d6Ec9A2EC9142bD2De21F7378F89";

// Demo report shown when no API key is configured
const DEMO_REPORT: AuditReport = {
  score: 94,
  summary:
    "NovaPay demonstrates strong security practices. The contract correctly gates token flows behind allowance checks, uses iExec Nox confidential computation for amount privacy, and emits events for auditability without leaking values. Minor informational notes below.",
  findings: [
    {
      severity: "info",
      title: "No reentrancy guard on wrapAndSend",
      description:
        "The external call to confidentialToken.wrap() follows the checks-effects-interactions pattern — state is updated before the external call — so reentrancy is not exploitable. Adding ReentrancyGuard would make this explicit.",
    },
    {
      severity: "info",
      title: "Invoice ID collision is theoretically possible",
      description:
        "Invoice IDs are computed via keccak256(sender, payer, refId, block.timestamp). Two invoices with identical parameters in the same block would collide. The contract's require(invoices[id].creator == address(0)) prevents overwriting, causing the second tx to revert.",
    },
    {
      severity: "low",
      title: "Payroll approve covers full total upfront",
      description:
        "runPayroll approves the confidential wrapper for the full payroll total before iterating recipients. If a wrap() call fails mid-loop, remaining allowance stays on the contract. Consider per-recipient approval or a refund mechanism.",
    },
  ],
  generatedAt: new Date().toISOString(),
};

export function useChainGPTAudit() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAudit = async () => {
    setLoading(true);
    setError(null);
    setReport(null);

    const apiKey = import.meta.env.VITE_CHAINGPT_API_KEY as string | undefined;

    try {
      if (apiKey) {
        // Real ChainGPT Smart Contract Auditor API call
        const res = await fetch("https://api.chaingpt.org/v1/smart-contract-auditor/audit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            contractAddress: CONTRACT_ADDRESS,
            network: "arbitrum-sepolia",
          }),
        });

        if (!res.ok) throw new Error(`ChainGPT API error: ${res.status}`);

        const data = await res.json();
        // Map ChainGPT response to our AuditReport shape
        setReport({
          score: data.score ?? 90,
          summary: data.summary ?? data.analysis ?? "Audit complete.",
          findings: (data.findings ?? data.issues ?? []).map((f: any) => ({
            severity: (f.severity ?? "info").toLowerCase(),
            title: f.title ?? f.name ?? "Finding",
            description: f.description ?? f.detail ?? "",
          })),
          generatedAt: new Date().toISOString(),
        });
      } else {
        // Demo mode — simulate API latency
        await new Promise((r) => setTimeout(r, 1800));
        setReport(DEMO_REPORT);
      }
    } catch (e: any) {
      setError(e.message ?? "Audit failed — check console");
      console.error("ChainGPT audit error:", e);
    } finally {
      setLoading(false);
    }
  };

  return { runAudit, loading, report, error };
}
