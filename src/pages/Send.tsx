import { useState, useEffect } from "react";
import { useWalletClient, useEstimateFeesPerGas } from "wagmi";
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { parseUnits, formatUnits, parseAbi } from "viem";
import { AppShell } from "@/components/paysec/AppShell";
import { PageHeader } from "@/components/paysec/PageHeader";
import { EncryptionPill } from "@/components/paysec/EncryptionPill";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/paysec/WalletContext";
import { useApproveUSDC, useUSDCAllowance, useWrapAndSend } from "@/hooks/usePaySec";
import { createViemHandleClient } from "@iexec-nox/handle";
import { Lock, ArrowRight, ShieldCheck, Cpu, CheckCircle2, Send as SendIcon } from "lucide-react";

const USDC_ADDRESS = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" as const;
const CUSDC_ADDRESS = "0x1ccec6bc60db15e4055d43dc2531bb7d4e5b808e" as const;
const USDC_BAL_ABI = parseAbi(["function balanceOf(address) external view returns (uint256)"]);
const CUSDC_ABI = parseAbi(["function unwrap(address from, address to, uint256 encryptedAmount, bytes inputProof) external returns (uint256)"]);

const Send = () => {
  const { connected, fullAddress } = useWallet();
  const { data: walletClient } = useWalletClient();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [unwrapAmount, setUnwrapAmount] = useState("");
  const [isEncryptingUnwrap, setIsEncryptingUnwrap] = useState(false);
  const [unwrapStatus, setUnwrapStatus] = useState<string | null>(null);

  // Real USDC balance
  const { data: usdcBal } = useReadContract({
    address: USDC_ADDRESS, abi: USDC_BAL_ABI, functionName: "balanceOf",
    args: [fullAddress!], query: { enabled: !!fullAddress, refetchInterval: 10_000 },
  });
  const balDisplay = usdcBal !== undefined ? parseFloat(formatUnits(usdcBal, 6)).toFixed(2) : "—";

  // Send flow
  const amountBig = amount ? parseUnits(amount, 6) : 0n;
  const allowance = useUSDCAllowance();
  const hasAllowance = (allowance.data ?? 0n) >= amountBig && amountBig > 0n;
  const isValidRecipient = recipient.startsWith("0x") && recipient.length === 42;
  const { approve, isPending: isApproving, isConfirming: isApproveConfirming } = useApproveUSDC();
  const { wrapAndSend, isPending: isSending, isConfirming: isSendConfirming, isSuccess: sent, hash: sendHash } = useWrapAndSend();

  const handleMaxAmount = () => {
    if (usdcBal) setAmount(formatUnits(usdcBal, 6));
  };

  // Unwrap flow
  const { data: feeData } = useEstimateFeesPerGas();
  const gasOverrides = feeData?.maxFeePerGas
    ? { maxFeePerGas: feeData.maxFeePerGas * 2n, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? 0n }
    : {};
  const { writeContract, data: unwrapHash, isPending: isUnwrapping, error: unwrapError } = useWriteContract();
  const { isLoading: isUnwrapConfirming, isSuccess: unwrapSuccess } = useWaitForTransactionReceipt({ hash: unwrapHash });

  useEffect(() => {
    if (unwrapError) {
      const msg = (unwrapError as { shortMessage?: string }).shortMessage ?? unwrapError.message;
      setUnwrapStatus(msg.includes("revert") ? "❌ Unwrap reverted — Nox TEE gateway mismatch on testnet." : `❌ ${msg}`);
    }
  }, [unwrapError]);

  const handleUnwrap = async () => {
    if (!walletClient || !fullAddress || !unwrapAmount) return;
    try {
      setIsEncryptingUnwrap(true);
      setUnwrapStatus("Encrypting amount with Nox TEE...");
      const client = await createViemHandleClient(walletClient);
      const amountWei = parseUnits(unwrapAmount, 6);
      const { handle, handleProof } = await client.encryptInput(amountWei, "uint256", CUSDC_ADDRESS);
      setIsEncryptingUnwrap(false);
      setUnwrapStatus("Confirm in wallet...");
      writeContract({ address: CUSDC_ADDRESS, abi: CUSDC_ABI, functionName: "unwrap", args: [fullAddress, fullAddress, handle as unknown as bigint, handleProof], gas: 500_000n, ...gasOverrides });
    } catch (e) {
      setIsEncryptingUnwrap(false);
      setUnwrapStatus("❌ Encryption failed — check console");
      console.error(e);
    }
  };

  if (!connected) {
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <p className="text-muted-foreground">Connect your wallet to send payments.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-6 py-8">
        <PageHeader eyebrow="Confidential Layer Active" title="Private Send" description="Amount is hidden on-chain via iExec Nox confidential token." />

        <div className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-4">
            {/* Send card */}
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Available USDC</p>
                <p className="font-mono text-base font-semibold tracking-tight">{balDisplay} <span className="text-xs text-muted-foreground">USDC</span></p>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recipient address</label>
                  <input type="text" placeholder="0x…" value={recipient} onChange={e => setRecipient(e.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-hairline bg-background px-4 font-mono text-sm shadow-soft outline-none transition-shadow focus:shadow-glow-cyan" />
                </div>

                <div>
                  <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Amount (USDC)</span>
                    <button onClick={handleMaxAmount} className="text-accent hover:text-accent-glow">MAX</button>
                  </label>
                  <input value={amount} onChange={e => setAmount(e.target.value)} type="text" placeholder="0.00"
                    className="mt-2 h-11 w-full rounded-xl border border-hairline bg-background px-4 font-mono text-sm shadow-soft outline-none transition-shadow focus:shadow-glow-cyan" />
                </div>

                {!hasAllowance ? (
                  <Button onClick={() => approve(amount)} disabled={!amount || isApproving || isApproveConfirming}
                    className="cta-cyan h-12 w-full rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-cyan-gradient">
                    {isApproving ? "Confirm in wallet..." : isApproveConfirming ? "Approving..." : "Step 1 — Approve USDC"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={() => wrapAndSend(recipient as `0x${string}`, amount)} disabled={!isValidRecipient || !amount || isSending || isSendConfirming}
                    className="cta-cyan h-12 w-full rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-cyan-gradient">
                    {isSending ? "Confirm in wallet..." : isSendConfirming ? "Sending..." : "Step 2 — Send Privately"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}

                {sent && sendHash && (
                  <div className="rounded-xl border border-accent/30 bg-accent-soft p-4 text-sm">
                    <p className="font-semibold text-foreground">✅ Sent privately!</p>
                    <a href={`https://sepolia.arbiscan.io/tx/${sendHash}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-muted-foreground hover:text-foreground break-all">{sendHash}</a>
                  </div>
                )}
              </div>
            </div>

            {/* Unwrap card */}
            <div className="card-elevated p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-base font-semibold tracking-tight">Unwrap cUSDC → USDC</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Enter the amount the sender told you. The Nox TEE verifies your confidential balance and finalizes the transfer on-chain.</p>
                </div>
                <EncryptionPill state="encrypting" />
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount to unwrap (USDC)</label>
                  <input value={unwrapAmount} onChange={e => setUnwrapAmount(e.target.value)} type="text" placeholder="0.00"
                    className="mt-2 h-11 w-full rounded-xl border border-hairline bg-background px-4 font-mono text-sm shadow-soft outline-none transition-shadow focus:shadow-glow-cyan" />
                </div>
                <Button onClick={handleUnwrap} disabled={!unwrapAmount || !walletClient || isEncryptingUnwrap || isUnwrapping || isUnwrapConfirming}
                  className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold uppercase tracking-wider">
                  <SendIcon className="mr-2 h-4 w-4" />
                  {isEncryptingUnwrap ? "Encrypting..." : isUnwrapping ? "Confirm in wallet..." : isUnwrapConfirming ? "Finalizing..." : "Unwrap to USDC"}
                </Button>
                {unwrapStatus && !unwrapSuccess && <p className="text-xs text-muted-foreground text-center">{unwrapStatus}</p>}
                {unwrapSuccess && unwrapHash && (
                  <div className="rounded-xl border border-accent/30 bg-accent-soft p-4 text-sm">
                    <p className="font-semibold">✅ Unwrap submitted — TEE will finalize shortly.</p>
                    <a href={`https://sepolia.arbiscan.io/tx/${unwrapHash}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-muted-foreground break-all">{unwrapHash}</a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card-elevated p-6">
              <h2 className="font-display flex items-center gap-2 text-base font-semibold tracking-tight">
                <ShieldCheck className="h-4 w-4 text-accent" />
                How unwrap works
              </h2>
              <ol className="mt-5 space-y-4">
                {[
                  { n: 1, icon: Lock, title: "Encrypted Notification", desc: "The sender shares the confidential transfer amount via a secure channel." },
                  { n: 2, icon: Cpu, title: "TEE Verification", desc: "iExec Nox Trusted Execution Environment validates the balance without exposing it to the public mempool." },
                  { n: 3, icon: CheckCircle2, title: "On-chain Settlement", desc: "Once verified, cUSDC is unwrapped back to standard USDC in your destination wallet." },
                ].map((s) => (
                  <li key={s.n} className="flex items-start gap-4">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft font-mono text-xs font-bold text-foreground ring-1 ring-accent/20">{s.n}</div>
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold"><s.icon className="h-3.5 w-3.5 text-accent" /> {s.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="card-confidential p-6">
              <div className="relative">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent ring-1 ring-accent/30">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="mt-5 font-display text-base font-semibold text-confidential-foreground">Powered by Confidential Computing</p>
                <p className="mt-1 text-xs leading-relaxed text-confidential-foreground/60">Technology for institutional-grade privacy. All amounts and recipients remain encrypted end-to-end.</p>
                <div className="mt-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-accent">
                  <span className="pulse-dot" /> Nox enclave online
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default Send;
