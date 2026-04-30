import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";
import { AppShell } from "@/components/paysec/AppShell";
import { EncryptionPill } from "@/components/paysec/EncryptionPill";
import { RedactedValue } from "@/components/paysec/RedactedValue";
import { useWallet } from "@/components/paysec/WalletContext";
import { NOVAPAY_ADDRESS } from "@/lib/contracts";
import { Activity, ArrowUpRight, ShieldCheck, TrendingUp, Users } from "lucide-react";

const PRIVATE_SENT = parseAbiItem("event PrivateSent(address indexed from, address indexed to, uint256 timestamp)");
const INVOICE_PAID = parseAbiItem("event InvoicePaid(bytes32 indexed invoiceId, address indexed payer, uint256 timestamp)");

interface TxRow { hash: string; type: string; from: string; ts: bigint; }

const stats = [
  { label: "Encrypted Volume (30d)", value: "•••• USDC", pill: "sealed" as const, icon: TrendingUp },
  { label: "Active Recipients", value: "•••• wallets", pill: "verified" as const, icon: Users },
  { label: "Nox Attestations", value: "1,284", pill: "encrypting" as const, icon: Activity },
];

const Dashboard = () => {
  const { address, fullAddress } = useWallet();
  const publicClient = usePublicClient();
  const [rows, setRows] = useState<TxRow[]>([]);

  useEffect(() => {
    if (!fullAddress || !publicClient) return;
    const load = async () => {
      try {
        const latest = await publicClient.getBlockNumber();
        const from = latest > 50_000n ? latest - 50_000n : 0n;
        const [sent, paid] = await Promise.all([
          publicClient.getLogs({ address: NOVAPAY_ADDRESS, event: PRIVATE_SENT, args: { from: fullAddress }, fromBlock: from, toBlock: latest }),
          publicClient.getLogs({ address: NOVAPAY_ADDRESS, event: INVOICE_PAID, fromBlock: from, toBlock: latest }),
        ]);
        const all: TxRow[] = [
          ...sent.map(l => ({ hash: `${l.transactionHash?.slice(0, 6)}…${l.transactionHash?.slice(-4)}`, type: "Private Send", from: `${(l.args.to as string).slice(0, 6)}…${(l.args.to as string).slice(-4)}`, ts: l.args.timestamp as bigint })),
          ...paid.map(l => ({ hash: `${l.transactionHash?.slice(0, 6)}…${l.transactionHash?.slice(-4)}`, type: "Invoice Paid", from: `${(l.args.payer as string).slice(0, 6)}…${(l.args.payer as string).slice(-4)}`, ts: l.args.timestamp as bigint })),
        ].sort((a, b) => Number(b.ts - a.ts)).slice(0, 4);
        setRows(all);
      } catch {}
    };
    load();
  }, [fullAddress, publicClient]);

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow"><span className="pulse-dot" />Live Enclave</p>
            <h1 className="font-display mt-4 text-4xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-2 text-muted-foreground">All values encrypted client-side. Hover to reveal.</p>
          </div>
          <div className="hidden items-center gap-3 rounded-full border border-hairline bg-card px-4 py-2 shadow-soft md:flex">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Nox · {address ?? "Public view"}</span>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="card-elevated p-6">
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent ring-1 ring-accent/20">
                  <s.icon className="h-4 w-4" />
                </div>
                <EncryptionPill state={s.pill} />
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{s.label}</p>
              <p className="font-display mt-2 text-3xl font-bold tracking-tight">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 card-elevated overflow-hidden">
          <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
            <h2 className="font-display text-lg font-semibold tracking-tight">Recent Activity</h2>
            <a href="/received" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr className="border-b border-hairline text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3 font-medium">Hash</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Counterparty</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">No recent activity found.</td>
                </tr>
              ) : rows.map((r, i) => (
                <tr key={i} className="border-b border-hairline last:border-0 hover:bg-secondary/40">
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{r.hash}</td>
                  <td className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">{r.type}</td>
                  <td className="px-6 py-4"><RedactedValue value={r.from} /></td>
                  <td className="px-6 py-4"><RedactedValue value="•••• USDC" /></td>
                  <td className="px-6 py-4"><EncryptionPill state="verified" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
};

export default Dashboard;
