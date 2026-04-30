import { useEffect, useState } from "react";
import { usePublicClient, useReadContract } from "wagmi";
import { formatUnits, isAddress, parseAbi, parseUnits } from "viem";
import { AppShell } from "@/components/paysec/AppShell";
import { PageHeader } from "@/components/paysec/PageHeader";
import { EncryptionPill } from "@/components/paysec/EncryptionPill";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/paysec/WalletContext";
import { useApproveUSDC, useRunPayroll, useUSDCAllowance } from "@/hooks/usePaySec";
import { NOVAPAY_ADDRESS } from "@/lib/contracts";
import { ArrowRight, History, Lock, UserPlus, Users } from "lucide-react";

const USDC_ADDRESS = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" as const;
const USDC_BAL_ABI = parseAbi(["function balanceOf(address) external view returns (uint256)"]);
const PAYROLL_RUNS_ABI = parseAbi(["function getMyPayrollRuns() external view returns (bytes32[])"]);
const PAYROLL_DETAILS_ABI = parseAbi(["function getPayrollRunDetails(bytes32) external view returns (address[], uint256)"]);

interface Member {
  name: string;
  wallet: string;
  salary: string;
}

interface HistoryRun {
  id: string;
  date: string;
  count: number;
}

function teamKey(address: string) {
  return `paysec-payroll-team-${address.toLowerCase()}`;
}

function loadTeam(address: string): Member[] {
  try {
    const raw = localStorage.getItem(teamKey(address));
    return raw ? (JSON.parse(raw) as Member[]) : [];
  } catch {
    return [];
  }
}

function saveTeam(address: string, team: Member[]) {
  try {
    localStorage.setItem(teamKey(address), JSON.stringify(team));
  } catch {}
}

const Payroll = () => {
  const { connected, fullAddress } = useWallet();
  const [team, setTeam] = useState<Member[]>([]);
  const [history, setHistory] = useState<HistoryRun[]>([]);
  const [name, setName] = useState("");
  const [wallet, setWallet] = useState("");
  const [salary, setSalary] = useState("");

  const { data: usdcBal } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_BAL_ABI,
    functionName: "balanceOf",
    args: [fullAddress!],
    query: { enabled: !!fullAddress, refetchInterval: 10_000 },
  });

  const balDisplay = usdcBal !== undefined ? parseFloat(formatUnits(usdcBal, 6)).toFixed(2) : "-";
  const total = team.reduce((sum, member) => sum + parseFloat(member.salary || "0"), 0);
  const totalBig = total > 0 ? parseUnits(total.toFixed(6), 6) : 0n;
  const allowance = useUSDCAllowance();
  const hasAllowance = (allowance.data ?? 0n) >= totalBig && totalBig > 0n;
  const hasBalance = usdcBal === undefined || usdcBal >= totalBig;
  const { approve, isPending: isApproving, isConfirming: isApproveConfirming, isSuccess: approved } = useApproveUSDC();
  const { runPayroll, isPending: isRunning, isConfirming: isRunConfirming, isSuccess: ranPayroll, hash, error: payrollError } = useRunPayroll();

  useEffect(() => {
    if (approved) allowance.refetch();
  }, [approved]);

  const publicClient = usePublicClient();
  const { data: runIds } = useReadContract({
    address: NOVAPAY_ADDRESS,
    abi: PAYROLL_RUNS_ABI,
    functionName: "getMyPayrollRuns",
    query: { enabled: !!fullAddress },
  });

  useEffect(() => {
    if (!fullAddress) {
      setTeam([]);
      return;
    }
    setTeam(loadTeam(fullAddress));
  }, [fullAddress]);

  useEffect(() => {
    if (!fullAddress) return;
    saveTeam(fullAddress, team);
  }, [fullAddress, team]);

  useEffect(() => {
    if (!runIds || !publicClient || !fullAddress) return;

    const load = async () => {
      const runs: HistoryRun[] = [];
      for (const id of runIds.slice(-5).reverse()) {
        try {
          const detail = await publicClient.readContract({
            address: NOVAPAY_ADDRESS,
            abi: PAYROLL_DETAILS_ABI,
            functionName: "getPayrollRunDetails",
            args: [id],
          });
          runs.push({
            id: `${id.slice(0, 6)}...${id.slice(-4)}`,
            date: new Date(Number(detail[1]) * 1000).toLocaleDateString(),
            count: detail[0].length,
          });
        } catch {}
      }
      setHistory(runs);
    };

    load();
  }, [fullAddress, publicClient, runIds]);

  const handleAddMember = () => {
    if (!name || !isAddress(wallet) || !salary || Number(salary) <= 0) return;
    setTeam(current => [...current, { name, wallet, salary }]);
    setName("");
    setWallet("");
    setSalary("");
  };

  const handleRunPayroll = () => {
    if (team.length === 0) return;
    runPayroll(team.map(member => member.wallet as `0x${string}`), team.map(member => member.salary));
  };

  if (!connected) return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-24 text-center"><p className="text-muted-foreground">Connect your wallet to run payroll.</p></div>
    </AppShell>
  );

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-6 py-12">
        <PageHeader eyebrow="Hidden Payroll" title="Payroll" description="Batch confidential salary payments to your team." />

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-6">
            <div className="card-elevated p-7">
              <div className="flex items-center justify-between">
                <h2 className="font-display flex items-center gap-2 text-lg font-semibold tracking-tight"><UserPlus className="h-4 w-4 text-accent" />Add Team Member</h2>
                <EncryptionPill state="sealed" />
              </div>
              <div className="mt-6 space-y-4">
                <div><label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</label><input placeholder="Ada Lovelace" value={name} onChange={event => setName(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-hairline bg-background px-4 text-sm shadow-soft outline-none transition-shadow focus:shadow-glow-cyan" /></div>
                <div><label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wallet address</label><input placeholder="0x..." value={wallet} onChange={event => setWallet(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-hairline bg-background px-4 font-mono text-sm shadow-soft outline-none transition-shadow focus:shadow-glow-cyan" /></div>
                <div><label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Salary (USDC)</label><input placeholder="0.00" value={salary} onChange={event => setSalary(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-hairline bg-background px-4 font-mono text-sm shadow-soft outline-none transition-shadow focus:shadow-glow-cyan" /></div>
                <Button onClick={handleAddMember} disabled={!name || !isAddress(wallet) || !salary || Number(salary) <= 0} className="h-11 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold uppercase tracking-wider">Add Member</Button>
              </div>
            </div>

            <div className="card-elevated p-6">
              <div className="space-y-3 divide-y divide-hairline">
                {[["Team", team.length.toString()], ["Total", `${total.toFixed(2)} USDC`], ["Available USDC", `${balDisplay} USDC`]].map(([key, value], index) => (
                  <div key={index} className="flex items-center justify-between py-2 first:pt-0"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{key}</span><span className="font-mono text-sm font-semibold">{value}</span></div>
                ))}
              </div>

              {team.length > 0 && !hasBalance && (
                <p className="mt-3 text-xs text-destructive">Wallet balance is below this payroll total.</p>
              )}
              {team.length > 0 && !hasAllowance && (
                <Button onClick={() => approve(total.toFixed(6))} disabled={isApproving || isApproveConfirming || !hasBalance} className="cta-cyan mt-5 h-12 w-full rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-cyan-gradient">
                  <Lock className="mr-2 h-4 w-4" />{isApproving ? "Confirm..." : isApproveConfirming ? "Approving..." : "Step 1 - Approve Payroll Total"}<ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              {team.length > 0 && hasAllowance && (
                <Button onClick={handleRunPayroll} disabled={isRunning || isRunConfirming || !hasBalance} className="cta-cyan mt-5 h-12 w-full rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-cyan-gradient">
                  <Lock className="mr-2 h-4 w-4" />{isRunning ? "Confirm..." : isRunConfirming ? "Running..." : "Step 2 - Run Payroll"}<ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              {ranPayroll && hash && <div className="mt-3 rounded-xl border border-accent/30 bg-accent-soft p-3 text-xs"><p className="font-semibold">Payroll sent!</p><a href={`https://sepolia.arbiscan.io/tx/${hash}`} target="_blank" rel="noreferrer" className="font-mono text-muted-foreground break-all">{hash}</a></div>}
              {payrollError && <p className="mt-3 text-xs text-destructive">{(payrollError as { shortMessage?: string }).shortMessage ?? payrollError.message}</p>}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="card-elevated overflow-hidden">
              <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
                <h2 className="font-display flex items-center gap-2 text-lg font-semibold tracking-tight"><Users className="h-4 w-4 text-accent" />Team List</h2>
                <span className="rounded-full border border-hairline bg-secondary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{team.length} Members</span>
              </div>
              {team.length === 0 ? (
                <div className="px-6 py-14 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-muted-foreground ring-1 ring-hairline"><Users className="h-5 w-5" /></div><p className="mt-4 text-sm font-medium">No team members added yet.</p><p className="mt-1 text-xs text-muted-foreground">Use the form to add recipients.</p></div>
              ) : (
                <div>
                  {team.map((member, index) => (
                    <div key={index} className="flex items-center justify-between border-b border-hairline px-6 py-4 last:border-0">
                      <div><p className="text-sm font-medium">{member.name}</p><p className="font-mono text-xs text-muted-foreground">{member.wallet.slice(0, 6)}...{member.wallet.slice(-4)}</p></div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-semibold">{member.salary} USDC</span>
                        <button onClick={() => setTeam(current => current.filter((_, itemIndex) => itemIndex !== index))} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card-elevated overflow-hidden">
              <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
                <h2 className="font-display flex items-center gap-2 text-lg font-semibold tracking-tight"><History className="h-4 w-4 text-accent" />Payroll History</h2>
              </div>
              {history.length === 0 ? (
                <div className="px-6 py-14 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-muted-foreground ring-1 ring-hairline"><History className="h-5 w-5" /></div><p className="mt-4 text-sm font-medium">No payroll runs yet.</p><p className="mt-1 text-xs text-muted-foreground">Completed runs appear here for this wallet.</p></div>
              ) : (
                <div>
                  {history.map((run, index) => (
                    <div key={index} className="flex items-center justify-between border-b border-hairline px-6 py-4 last:border-0">
                      <div><p className="font-mono text-xs text-muted-foreground">{run.id}</p><p className="text-sm font-medium">{run.date}</p></div>
                      <span className="rounded-full border border-hairline bg-secondary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{run.count} recipients</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default Payroll;
