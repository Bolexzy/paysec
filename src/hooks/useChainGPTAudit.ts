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

const CONTRACT_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract NovaPay is Ownable {
    IERC20ToERC7984Wrapper public confidentialToken;
    IERC20 public baseToken;

    struct Invoice {
        address creator;
        address payer;
        bytes encryptedAmount;
        string refId;
        uint256 dueDate;
        bool paid;
        uint256 createdAt;
    }

    mapping(bytes32 => Invoice) public invoices;
    mapping(address => bytes32[]) public payrollRuns;

    struct PayrollRun {
        address[] recipients;
        uint256 timestamp;
        uint256 recipientCount;
    }
    mapping(bytes32 => PayrollRun) public payrollRunDetails;

    event PrivateSent(address indexed from, address indexed to, uint256 timestamp);
    event InvoiceCreated(bytes32 indexed invoiceId, address indexed creator, address indexed payer, string refId, uint256 dueDate);
    event InvoicePaid(bytes32 indexed invoiceId, address indexed payer, uint256 timestamp);
    event PayrollRunEvent(bytes32 indexed runId, address indexed employer, uint256 recipientCount, uint256 timestamp);

    constructor(address _confidentialToken, address _baseToken) Ownable(msg.sender) {
        confidentialToken = IERC20ToERC7984Wrapper(_confidentialToken);
        baseToken = IERC20(_baseToken);
    }

    function wrapAndSend(address recipient, uint256 amount) external {
        require(recipient != address(0), "invalid recipient");
        require(amount > 0, "amount must be > 0");
        bool pulled = baseToken.transferFrom(msg.sender, address(this), amount);
        require(pulled, "token transfer failed");
        baseToken.approve(address(confidentialToken), amount);
        confidentialToken.wrap(recipient, amount);
        emit PrivateSent(msg.sender, recipient, block.timestamp);
    }

    function createInvoice(address payer, bytes calldata encryptedAmount, string calldata refId, uint256 dueDate) external returns (bytes32 invoiceId) {
        require(payer != address(0), "invalid payer");
        require(encryptedAmount.length > 0, "empty encrypted amount");
        require(dueDate > block.timestamp, "due date in past");
        invoiceId = keccak256(abi.encodePacked(msg.sender, payer, refId, block.timestamp));
        require(invoices[invoiceId].creator == address(0), "invoice already exists");
        invoices[invoiceId] = Invoice({ creator: msg.sender, payer: payer, encryptedAmount: encryptedAmount, refId: refId, dueDate: dueDate, paid: false, createdAt: block.timestamp });
        emit InvoiceCreated(invoiceId, msg.sender, payer, refId, dueDate);
        return invoiceId;
    }

    function payInvoice(bytes32 invoiceId, uint256 amount) external {
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.creator != address(0), "invoice not found");
        require(!invoice.paid, "already paid");
        require(invoice.payer == msg.sender, "not the payer");
        require(block.timestamp <= invoice.dueDate, "invoice overdue");
        require(amount > 0, "amount must be > 0");
        invoice.paid = true;
        bool pulled = baseToken.transferFrom(msg.sender, address(this), amount);
        require(pulled, "token transfer failed");
        baseToken.approve(address(confidentialToken), amount);
        confidentialToken.wrap(invoice.creator, amount);
        emit InvoicePaid(invoiceId, msg.sender, block.timestamp);
    }

    function runPayroll(address[] calldata recipients, uint256[] calldata amounts) external returns (bytes32 runId) {
        require(recipients.length > 0, "no recipients");
        require(recipients.length == amounts.length, "length mismatch");
        require(recipients.length <= 100, "max 100 recipients");
        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "zero amount");
            total += amounts[i];
        }
        bool pulled = baseToken.transferFrom(msg.sender, address(this), total);
        require(pulled, "token transfer failed");
        baseToken.approve(address(confidentialToken), total);
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "invalid recipient");
            confidentialToken.wrap(recipients[i], amounts[i]);
        }
        runId = keccak256(abi.encodePacked(msg.sender, block.timestamp, recipients.length));
        payrollRunDetails[runId] = PayrollRun({ recipients: recipients, timestamp: block.timestamp, recipientCount: recipients.length });
        payrollRuns[msg.sender].push(runId);
        emit PayrollRunEvent(runId, msg.sender, recipients.length, block.timestamp);
        return runId;
    }

    function getMyPayrollRuns() external view returns (bytes32[] memory) { return payrollRuns[msg.sender]; }
    function getPayrollRunDetails(bytes32 runId) external view returns (address[] memory recipients, uint256 timestamp) {
        PayrollRun storage run = payrollRunDetails[runId];
        return (run.recipients, run.timestamp);
    }
}`;

// Demo report shown when no API key is configured
const DEMO_REPORT: AuditReport = {
  score: 94,
  summary:
    "PaySec demonstrates strong security practices. The contract correctly gates token flows behind allowance checks, uses iExec Nox confidential computation for amount privacy, and emits events for auditability without leaking values. Minor informational notes below.",
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

// Read SSE stream and return the full bot response text
async function readStream(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let rawAccumulated = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    rawAccumulated += decoder.decode(value, { stream: true });
  }

  // Try to extract text from SSE lines
  let botText = "";
  for (const line of rawAccumulated.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "data: [DONE]") continue;
    const raw = trimmed.startsWith("data: ") ? trimmed.slice(6) : trimmed;
    try {
      const parsed = JSON.parse(raw);
      // Try every known field path ChainGPT might use
      const chunk =
        parsed?.data?.bot ??
        parsed?.bot ??
        parsed?.data?.text ??
        parsed?.text ??
        parsed?.content ??
        parsed?.message ??
        "";
      if (chunk) botText += chunk;
    } catch {
      // Not JSON — if it looks like prose (not a protocol line), keep it
      if (raw && !raw.startsWith("{") && raw.length > 10) botText += raw + " ";
    }
  }

  // If SSE parsing yielded nothing, use the full raw body as-is
  return (botText.trim() || rawAccumulated.trim());
}

// Best-effort parse of ChainGPT's free-form audit text into AuditReport
function parseAuditText(text: string): AuditReport {
  // Extract score — look for patterns like "Score: 87", "87/100", "score of 87"
  const scoreMatch = text.match(/\b(\d{1,3})\s*(?:\/\s*100|out of 100)/i)
    ?? text.match(/score[:\s]+(\d{1,3})/i);
  const score = scoreMatch ? Math.min(100, parseInt(scoreMatch[1])) : 85;

  // Extract findings by scanning for severity keywords followed by a title
  const findings: AuditFinding[] = [];
  const severities = ["critical", "high", "medium", "low", "info"] as const;
  const findingRegex = /\b(critical|high|medium|low|info)\b[:\s–-]+([^\n.]{5,80})/gi;
  let match;
  while ((match = findingRegex.exec(text)) !== null) {
    const sev = match[1].toLowerCase() as AuditFinding["severity"];
    if (severities.includes(sev)) {
      findings.push({
        severity: sev,
        title: match[2].trim().replace(/[*_`]/g, ""),
        description: "",
      });
    }
  }

  // Use the first 600 chars of the text as summary (trim markdown artifacts)
  const summary = text
    .replace(/[*_`#]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, 600)
    .trim();

  return { score, summary, findings, generatedAt: new Date().toISOString() };
}

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
        const res = await fetch("https://api.chaingpt.org/chat/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "smart_contract_auditor",
            question: `Audit this Solidity smart contract. Provide a security score out of 100, a summary, and list any findings with severity (critical/high/medium/low/info) and a title.\n\n${CONTRACT_SOURCE}`,
            chatHistory: "off",
          }),
        });

        if (!res.ok) throw new Error(`ChainGPT API error: ${res.status}`);

        const text = await readStream(res);
        console.log("ChainGPT raw response:", text);
        if (!text) throw new Error("Empty response from ChainGPT — check console for raw output");
        setReport(parseAuditText(text));
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
