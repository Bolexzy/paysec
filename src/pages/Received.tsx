import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";
import { AppShell } from "@/components/paysec/AppShell";
import { PageHeader } from "@/components/paysec/PageHeader";
import { useWallet } from "@/components/paysec/WalletContext";
import { NOVAPAY_ADDRESS } from "@/lib/contracts";
import { ArrowDownLeft, FileText, Inbox, Loader2 } from "lucide-react";

const PRIVATE_SENT = parseAbiItem("event PrivateSent(address indexed from, address indexed to, uint256 timestamp)");
const INVOICE_CREATED = parseAbiItem("event InvoiceCreated(bytes32 indexed invoiceId, address indexed creator, address indexed payer, string refId, uint256 dueDate)");
const INVOICE_PAID = parseAbiItem("event InvoicePaid(bytes32 indexed invoiceId, address indexed payer, uint256 timestamp)");

interface CachedRow {
  type: string;
  id: string | null;
  iconType: "file" | "arrow";
  sender: string;
  date: string;
  txHash: string;
}

interface Cache {
  rows: CachedRow[];
  lastBlock: string;
}

type EventLog = {
  args: Record<string, unknown>;
  transactionHash?: `0x${string}` | null;
};

function cacheKey(addr: string) {
  return `novapay-rx-${addr.toLowerCase()}`;
}

function loadCache(addr: string): Cache | null {
  try {
    const raw = localStorage.getItem(cacheKey(addr));
    return raw ? (JSON.parse(raw) as Cache) : null;
  } catch {
    return null;
  }
}

function saveCache(addr: string, cache: Cache) {
  try {
    localStorage.setItem(cacheKey(addr), JSON.stringify(cache));
  } catch {}
}

const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
const formatDate = (timestamp: bigint) => new Date(Number(timestamp) * 1000).toLocaleString();

const Received = () => {
  const { connected, fullAddress } = useWallet();
  const publicClient = usePublicClient();
  const [rows, setRows] = useState<CachedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!fullAddress || !publicClient) return;

    const load = async () => {
      const cache = loadCache(fullAddress);
      if (cache) {
        setRows(cache.rows);
        setLoading(false);
        setSyncing(true);
      }

      try {
        const latest = await publicClient.getBlockNumber();
        const chunk = 10_000n;
        const depth = 1_000_000n;
        const scanFrom = cache ? BigInt(cache.lastBlock) + 1n : latest > depth ? latest - depth : 0n;

        if (scanFrom >= latest) {
          setLoading(false);
          setSyncing(false);
          return;
        }

        const sendRows: CachedRow[] = [];
        const createdRaw: EventLog[] = [];
        const paidRaw: EventLog[] = [];

        for (let start = scanFrom; start < latest; start += chunk) {
          const end = start + chunk - 1n < latest ? start + chunk - 1n : latest;
          const [sentLogs, createdLogs, paidLogs] = await Promise.all([
            publicClient.getLogs({ address: NOVAPAY_ADDRESS, event: PRIVATE_SENT, args: { to: fullAddress }, fromBlock: start, toBlock: end }),
            publicClient.getLogs({ address: NOVAPAY_ADDRESS, event: INVOICE_CREATED, args: { creator: fullAddress }, fromBlock: start, toBlock: end }),
            publicClient.getLogs({ address: NOVAPAY_ADDRESS, event: INVOICE_PAID, fromBlock: start, toBlock: end }),
          ]);

          sentLogs.forEach(log => {
            const from = log.args.from as string;
            sendRows.push({
              type: "DIRECT TRANSFER",
              id: null,
              iconType: "arrow",
              sender: formatAddress(from),
              date: formatDate(log.args.timestamp as bigint),
              txHash: log.transactionHash ?? "",
            });
          });
          createdRaw.push(...(createdLogs as EventLog[]));
          paidRaw.push(...(paidLogs as EventLog[]));
        }

        const paidMap = new Map(paidRaw.map(log => [log.args.invoiceId as string, log]));
        const invoiceRows: CachedRow[] = [];

        for (const log of createdRaw) {
          const paidLog = paidMap.get(log.args.invoiceId as string);
          if (!paidLog) continue;
          const payer = log.args.payer as string;
          invoiceRows.push({
            type: "INVOICE PAID",
            id: log.args.refId as string,
            iconType: "file",
            sender: formatAddress(payer),
            date: formatDate(paidLog.args.timestamp as bigint),
            txHash: paidLog.transactionHash ?? "",
          });
        }

        const seen = new Set<string>();
        const merged = [...(cache?.rows ?? []), ...sendRows, ...invoiceRows].filter(row => {
          if (seen.has(row.txHash)) return false;
          seen.add(row.txHash);
          return true;
        });

        setRows(merged);
        saveCache(fullAddress, { rows: merged, lastBlock: String(latest) });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    };

    load();
  }, [fullAddress, publicClient]);

  if (!connected) return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-16 text-center"><p className="text-muted-foreground">Connect your wallet to view received payments.</p></div>
    </AppShell>
  );

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-start justify-between">
          <PageHeader eyebrow="Confidential Inbox" title="Received Payments" description="Amounts are confidential - only visible to you via the Nox TEE." />
          {syncing && <span className="text-xs text-muted-foreground animate-pulse mt-5">Syncing...</span>}
        </div>

        {loading ? (
          <div className="mt-7 card-elevated p-10 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-accent" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">Scanning payment history...</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">First load only - cached after this</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-7 card-elevated p-10 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent ring-1 ring-accent/20"><Inbox className="h-5 w-5" /></div>
            <p className="mt-4 font-display text-base font-semibold">No payments yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Incoming confidential settlements will appear here.</p>
          </div>
        ) : (
          <div className="mt-7 card-elevated overflow-hidden">
            <div className="grid grid-cols-12 gap-4 border-b border-hairline px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <div className="col-span-4">Transaction</div>
              <div className="col-span-3">Sender</div>
              <div className="col-span-3">Date / Time</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>
            {rows.map((row, index) => (
              <div key={index} className="grid grid-cols-12 items-center gap-4 border-b border-hairline px-5 py-3.5 last:border-0 hover:bg-secondary/40">
                <div className="col-span-4 flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent ring-1 ring-accent/20">
                    {row.iconType === "file" ? <FileText className="h-3.5 w-3.5" /> : <ArrowDownLeft className="h-3.5 w-3.5" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">{row.type}</p>
                    {row.id && <p className="font-mono text-xs text-muted-foreground">{row.id}</p>}
                  </div>
                </div>
                <div className="col-span-3 font-mono text-xs text-muted-foreground">{row.sender}</div>
                <div className="col-span-3 font-mono text-xs text-muted-foreground">{row.date}</div>
                <div className="col-span-2 flex justify-end">
                  <a href={`https://sepolia.arbiscan.io/tx/${row.txHash}`} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-confidential px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-confidential-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Confidential
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
};

export default Received;
