import { parseAbi } from "viem";

export const NOVAPAY_ADDRESS =
  (import.meta.env.VITE_NOVAPAY_ADDRESS as `0x${string}`) ??
  "0xF802a2ba4e80d6Ec9A2EC9142bD2De21F7378F89";

export const NOVAPAY_ABI = parseAbi([
  // ── Flow 1: Private Send ──
  "function wrapAndSend(address recipient, uint256 amount) external",

  // ── Flow 2: Confidential Invoice ──
  "function createInvoice(address payer, bytes encryptedAmount, string refId, uint256 dueDate) external returns (bytes32)",
  "function payInvoice(bytes32 invoiceId, uint256 amount) external",
  "function invoices(bytes32) external view returns (address, address, bytes, string, uint256, bool, uint256)",

  // ── Flow 3: Confidential Payroll ──
  "function runPayroll(address[] recipients, uint256[] amounts) external returns (bytes32)",
  "function getMyPayrollRuns() external view returns (bytes32[])",
  "function getPayrollRunDetails(bytes32 runId) external view returns (address[], uint256)",

  // ── Events ──
  "event PrivateSent(address indexed from, address indexed to, uint256 timestamp)",
  "event InvoiceCreated(bytes32 indexed invoiceId, address indexed creator, address indexed payer, string refId, uint256 dueDate)",
  "event InvoicePaid(bytes32 indexed invoiceId, address indexed payer, uint256 timestamp)",
  "event PayrollRunEvent(bytes32 indexed runId, address indexed employer, uint256 recipientCount, uint256 timestamp)",
]);
