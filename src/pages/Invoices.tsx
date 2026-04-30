import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePublicClient, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { parseAbi, parseAbiItem, parseEventLogs, parseUnits } from "viem";
import { AppShell } from "@/components/paysec/AppShell";
import { PageHeader } from "@/components/paysec/PageHeader";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/paysec/WalletContext";
import { useApproveUSDC, useCreateInvoice, usePayInvoice, useUSDCAllowance } from "@/hooks/usePaySec";
import { NOVAPAY_ADDRESS } from "@/lib/contracts";
import { decryptInvoice, encryptInvoice, generateRefId, type InvoiceData } from "@/lib/encryption";
import { copyInvoiceLink, formatInvoiceId, generateInvoiceLink } from "@/lib/invoiceLink";
import { Building2, FileText, Loader2, Lock, Plus, ShieldCheck } from "lucide-react";

const INVOICE_CREATED_EVENT = parseAbiItem("event InvoiceCreated(bytes32 indexed invoiceId, address indexed creator, address indexed payer, string refId, uint256 dueDate)");
const INVOICE_PAID_EVENT = parseAbiItem("event InvoicePaid(bytes32 indexed invoiceId, address indexed payer, uint256 timestamp)");
const INVOICE_CREATED_ABI = parseAbi(["event InvoiceCreated(bytes32 indexed invoiceId, address indexed creator, address indexed payer, string refId, uint256 dueDate)"]);
const INVOICES_ABI = parseAbi(["function invoices(bytes32) external view returns (address, address, bytes, string, uint256, bool, uint256)"]);

const statusBadge = (status: "settled" | "private" | "pending") => {
  if (status === "settled") return <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-gradient px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary shadow-cta"><Lock className="h-3 w-3" /> Settled</span>;
  if (status === "private") return <span className="inline-flex items-center gap-1.5 rounded-full bg-confidential px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-confidential-foreground"><ShieldCheck className="h-3 w-3 text-accent" /> Private</span>;
  return <span className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-accent/30 bg-accent-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground"><span className="absolute inset-0 shimmer" aria-hidden /><span className="relative inline-block h-1.5 w-1.5 rounded-full bg-accent" /><span className="relative">Pending</span></span>;
};

interface Row {
  id: string;
  counterparty: string;
  amount: string;
  date: string;
  status: "settled" | "private" | "pending";
  invoiceId: string;
}

type EventLog = {
  args: Record<string, unknown>;
};

const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

const PaySection = ({ invoiceId }: { invoiceId: string }) => {
  const { connected, fullAddress } = useWallet();
  const [decrypted, setDecrypted] = useState<InvoiceData | null>(null);
  const [decrypting, setDecrypting] = useState(false);

  const { data: inv } = useReadContract({
    address: NOVAPAY_ADDRESS,
    abi: INVOICES_ABI,
    functionName: "invoices",
    args: [invoiceId as `0x${string}`],
    query: { enabled: !!invoiceId },
  });

  const creator = inv?.[0];
  const payer = inv?.[1];
  const encAmt = inv?.[2];
  const refId = inv?.[3];
  const dueDate = inv?.[4];
  const paid = inv?.[5];
  const isPayer = !!(fullAddress && payer && fullAddress.toLowerCase() === payer.toLowerCase());
  const amountBig = decrypted?.amount ? parseUnits(decrypted.amount, 6) : 0n;
  const allowance = useUSDCAllowance();
  const hasAllowance = (allowance.data ?? 0n) >= amountBig && amountBig > 0n;
  const { approve, isPending: isApproving, isConfirming: isApproveConfirming } = useApproveUSDC();
  const { payInvoice, isPending: isPaying, isConfirming: isPayConfirming, isSuccess: isPaid, hash } = usePayInvoice();

  useEffect(() => {
    if (!isPayer || !fullAddress || !encAmt || decrypting || decrypted) return;
    setDecrypting(true);
    decryptInvoice(encAmt, fullAddress).then(data => {
      setDecrypted(data);
      setDecrypting(false);
    });
  }, [decrypted, decrypting, encAmt, fullAddress, isPayer]);

  if (!inv || !payer) return <div className="mt-10 card-elevated p-14 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-accent" /><p className="mt-4 text-sm text-muted-foreground">Loading invoice...</p></div>;

  const formatDueDate = (timestamp: bigint) => new Date(Number(timestamp) * 1000).toLocaleDateString();

  return (
    <div className="mt-10 card-elevated overflow-hidden">
      <div className="h-1 w-full bg-cyan-gradient" />
      <div className="p-7">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{refId || formatInvoiceId(invoiceId)}</p>
            <h2 className="font-display text-xl font-semibold mt-1">Invoice Payment</h2>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${paid ? "bg-cyan-gradient text-primary shadow-cta" : "border border-accent/30 bg-accent-soft text-foreground"}`}>
            {paid ? <><Lock className="h-3 w-3" /> Settled</> : <><span className="h-1.5 w-1.5 rounded-full bg-accent inline-block" /> Pending</>}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-hairline bg-secondary/40 p-4 text-sm mb-6">
          {creator && <div><p className="text-xs uppercase tracking-wider text-muted-foreground">From</p><p className="font-mono mt-1">{formatAddress(creator)}</p></div>}
          {payer && <div><p className="text-xs uppercase tracking-wider text-muted-foreground">To</p><p className="font-mono mt-1">{formatAddress(payer)}</p></div>}
          {dueDate !== undefined && <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Due</p><p className="mt-1">{formatDueDate(dueDate)}</p></div>}
          <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Amount</p>
            {isPayer && decrypted ? <p className="font-semibold mt-1 text-accent">{decrypted.amount} USDC</p>
              : isPayer && decrypting ? <p className="text-muted-foreground italic mt-1">Decrypting...</p>
              : <p className="text-muted-foreground mt-1">Confidential</p>}
          </div>
        </div>
        {!connected && <p className="text-xs text-muted-foreground text-center bg-secondary/40 rounded-xl p-3">Connect wallet to decrypt and pay this invoice</p>}
        {connected && !isPayer && <p className="text-xs text-muted-foreground text-center bg-secondary/40 rounded-xl p-3">This invoice is not addressed to your wallet</p>}
        {isPayer && !paid && decrypted && (
          <div className="space-y-3">
            {!hasAllowance
              ? <Button onClick={() => approve(decrypted.amount)} disabled={isApproving || isApproveConfirming} className="cta-cyan h-12 w-full rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-cyan-gradient">
                  {isApproving ? "Confirm in wallet..." : isApproveConfirming ? "Approving..." : `Step 1 - Approve ${decrypted.amount} USDC`}<Lock className="ml-2 h-4 w-4" />
                </Button>
              : <Button onClick={() => payInvoice(invoiceId as `0x${string}`, decrypted.amount)} disabled={isPaying || isPayConfirming} className="cta-cyan h-12 w-full rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-cyan-gradient">
                  {isPaying ? "Confirm in wallet..." : isPayConfirming ? "Processing..." : `Step 2 - Pay ${decrypted.amount} USDC`}
                </Button>}
          </div>
        )}
        {isPaid && hash && <div className="mt-4 rounded-xl border border-accent/30 bg-accent-soft p-4 text-sm"><p className="font-semibold">Invoice paid!</p><a href={`https://sepolia.arbiscan.io/tx/${hash}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-muted-foreground break-all">{hash}</a></div>}
      </div>
    </div>
  );
};

const Invoices = () => {
  const [searchParams] = useSearchParams();
  const payId = searchParams.get("id");
  const { connected, fullAddress } = useWallet();
  const publicClient = usePublicClient();

  const [payerAddr, setPayerAddr] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [createStatus, setCreateStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);

  const { createInvoice, hash: createHash, isPending: isCreating, isConfirming: isCreateConfirming, isSuccess: createSuccess, error: createError } = useCreateInvoice();
  const { data: receipt } = useWaitForTransactionReceipt({ hash: createHash });

  useEffect(() => {
    if (!createSuccess || !receipt) return;
    const logs = parseEventLogs({ abi: INVOICE_CREATED_ABI, logs: receipt.logs });
    const id = logs[0]?.args.invoiceId;
    if (id) setCreatedId(id);
  }, [createSuccess, receipt]);

  useEffect(() => {
    if (!createError) return;
    const message = (createError as { shortMessage?: string }).shortMessage ?? createError.message;
    setCreateStatus(`Failed: ${message}`);
    setIsEncrypting(false);
  }, [createError]);

  useEffect(() => {
    if (!fullAddress || !publicClient) return;

    const load = async () => {
      setLoading(true);
      try {
        const latest = await publicClient.getBlockNumber();
        const depth = 1_000_000n;
        const chunk = 10_000n;
        const from = latest > depth ? latest - depth : 0n;
        const createdRaw: EventLog[] = [];
        const paidRaw: EventLog[] = [];

        for (let start = from; start < latest; start += chunk) {
          const end = start + chunk - 1n < latest ? start + chunk - 1n : latest;
          const [createdLogs, paidLogs] = await Promise.all([
            publicClient.getLogs({ address: NOVAPAY_ADDRESS, event: INVOICE_CREATED_EVENT, args: { creator: fullAddress }, fromBlock: start, toBlock: end }),
            publicClient.getLogs({ address: NOVAPAY_ADDRESS, event: INVOICE_PAID_EVENT, fromBlock: start, toBlock: end }),
          ]);
          createdRaw.push(...(createdLogs as EventLog[]));
          paidRaw.push(...(paidLogs as EventLog[]));
        }

        const paidSet = new Set(paidRaw.map(log => log.args.invoiceId as string));
        const entries: Row[] = createdRaw.map(log => ({
          id: (log.args.refId as string) || formatInvoiceId(log.args.invoiceId as string),
          counterparty: formatAddress(log.args.payer as string),
          amount: "Confidential",
          date: new Date(Number(log.args.dueDate as bigint) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          status: paidSet.has(log.args.invoiceId as string) ? "settled" : "private",
          invoiceId: log.args.invoiceId as string,
        }));

        setRows(entries.reverse());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [createSuccess, fullAddress, publicClient]);

  const handleCreate = async () => {
    if (!fullAddress || !payerAddr || !amount || !dueDate) return;
    try {
      setIsEncrypting(true);
      setCreateStatus("Encrypting invoice amount...");
      const dueDateTs = Math.floor(new Date(`${dueDate}T23:59:59Z`).getTime() / 1000);
      const refId = generateRefId(Date.now() % 1000);
      const { payloadForChain } = await encryptInvoice({ amount, token: "USDC", description: description || refId, refId, dueDate: dueDateTs }, payerAddr);
      setIsEncrypting(false);
      setCreateStatus("Confirm in wallet...");
      createInvoice(payerAddr as `0x${string}`, payloadForChain as `0x${string}`, refId, dueDateTs);
    } catch (error) {
      console.error(error);
      setCreateStatus("Encryption failed");
      setIsEncrypting(false);
    }
  };

  const handleCopy = async () => {
    if (!createdId) return;
    const ok = await copyInvoiceLink(createdId);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!connected) return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-16 text-center"><p className="text-muted-foreground">Connect your wallet to manage invoices.</p></div>
    </AppShell>
  );

  if (payId) return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-6 py-8">
        <PageHeader eyebrow="End-to-end encrypted" title="Pay Invoice" description="Amount is confidential - only your wallet can decrypt it." />
        <PaySection invoiceId={payId} />
      </section>
    </AppShell>
  );

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-6 py-8">
        <PageHeader eyebrow="End-to-end encrypted" title="Invoices" description="Create confidential invoices - amounts visible only to your client." />

        <div className="mt-7 card-elevated overflow-hidden">
          <div className="h-1 w-full bg-cyan-gradient" />
          <div className="p-6">
            <div className="flex items-center gap-2 rounded-xl border border-accent/25 bg-accent-soft px-4 py-3 text-sm">
              <Lock className="h-4 w-4 text-accent" />
              <span className="font-medium text-foreground">Amount is encrypted on-chain</span>
              <span className="text-muted-foreground">- only your client can decrypt it.</span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client wallet address</label>
                <input placeholder="0x..." value={payerAddr} onChange={event => setPayerAddr(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-hairline bg-background px-4 font-mono text-sm shadow-soft outline-none transition-shadow focus:shadow-glow-cyan" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount (USDC)</label>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">$</span>
                  <input placeholder="0.00" value={amount} onChange={event => setAmount(event.target.value)}
                    className="h-11 w-full rounded-xl border border-hairline bg-background pl-8 pr-4 font-mono text-sm shadow-soft outline-none transition-shadow focus:shadow-glow-cyan" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due date</label>
                <input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-hairline bg-background px-4 font-mono text-sm shadow-soft outline-none transition-shadow focus:shadow-glow-cyan" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description (optional)</label>
                <input placeholder="Logo design, consulting fee..." value={description} onChange={event => setDescription(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-hairline bg-background px-4 text-sm shadow-soft outline-none transition-shadow focus:shadow-glow-cyan" />
              </div>
            </div>

            <Button onClick={handleCreate} disabled={!payerAddr || !amount || !dueDate || isEncrypting || isCreating || isCreateConfirming || !!createdId}
              className="cta-cyan mt-5 h-11 w-full rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-cyan-gradient">
              <Plus className="mr-2 h-4 w-4" />
              {isEncrypting ? "Encrypting..." : isCreating ? "Confirm in wallet..." : isCreateConfirming ? "Creating..." : createdId ? "Invoice Created" : "Create Invoice"}
            </Button>

            {createStatus && !createSuccess && <p className="mt-3 text-xs text-muted-foreground text-center">{createStatus}</p>}

            {createSuccess && createdId && (
              <div className="mt-4 rounded-xl border border-accent/30 bg-accent-soft p-4 space-y-2">
                <p className="font-semibold text-sm">Invoice created! Share this link:</p>
                <div className="flex gap-2">
                  <input readOnly value={generateInvoiceLink(createdId)} className="flex-1 rounded-lg border border-hairline bg-card px-3 py-2 font-mono text-xs text-muted-foreground truncate" />
                  <button onClick={handleCopy} className="px-4 py-2 cta-cyan rounded-lg text-sm font-semibold">{copied ? "Copied!" : "Copy"}</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">My Invoices</p>
          {loading ? (
            <div className="mt-4 card-elevated p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-accent" /><p className="mt-4 text-sm font-medium text-muted-foreground">Loading invoices...</p><p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Decrypting via Nox enclave</p></div>
          ) : rows.length === 0 ? (
            <div className="mt-4 card-elevated p-10 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-accent-soft text-accent ring-1 ring-accent/20"><FileText className="h-4 w-4" /></div><p className="mt-4 text-sm font-medium">No invoices yet.</p><p className="mt-1 text-xs text-muted-foreground">Create your first confidential invoice above.</p></div>
          ) : (
            <div className="mt-4 card-elevated overflow-hidden">
              <div className="grid grid-cols-12 gap-4 border-b border-hairline px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <div className="col-span-2">Invoice ID</div><div className="col-span-4">Counterparty</div><div className="col-span-2">Amount</div><div className="col-span-2">Date</div><div className="col-span-2 text-right">Status</div>
              </div>
              {rows.map((row, index) => (
                <div key={index} className="grid grid-cols-12 items-center gap-4 border-b border-hairline px-5 py-3.5 last:border-0 hover:bg-secondary/40">
                  <div className="col-span-2 font-mono text-xs text-muted-foreground">{row.id}</div>
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-confidential text-accent ring-1 ring-white/10"><Lock className="h-3.5 w-3.5" /></div>
                    <span className="text-sm font-medium italic text-muted-foreground">{row.counterparty}</span>
                  </div>
                  <div className="col-span-2 font-mono text-sm"><span className="redact" data-masked="true">{row.amount}</span></div>
                  <div className="col-span-2 font-mono text-xs text-muted-foreground">{row.date}</div>
                  <div className="col-span-2 flex justify-end">{statusBadge(row.status)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
};

export default Invoices;
