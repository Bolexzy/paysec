import { AppShell } from "@/components/paysec/AppShell";
import { HeroMesh } from "@/components/paysec/HeroMesh";
import { EncryptionPill } from "@/components/paysec/EncryptionPill";
import { RedactedValue } from "@/components/paysec/RedactedValue";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/paysec/WalletContext";
import { ArrowRight, FileLock2, Users, EyeOff, ShieldCheck, Activity } from "lucide-react";

const Index = () => {
  const { connect } = useWallet();

  return (
    <AppShell>
      {/* ── Hero ── */}
      <section className="relative">
        <HeroMesh />
        <div className="relative mx-auto max-w-5xl px-6 pb-16 pt-14 md:pt-12">
          <div className="flex flex-col items-center text-center">
            <span className="eyebrow">
              <span className="pulse-dot" />
              Confidentiality by Design
            </span>

            <h1 className="font-display mt-6 max-w-3xl text-balance text-4xl font-bold leading-[1.08] tracking-tight text-foreground md:text-5xl">
              Private payments. Confidential invoices.{" "}
              <span className="bg-gradient-to-r from-accent to-accent-glow bg-clip-text text-transparent">
                Hidden payroll.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-balance text-base leading-relaxed text-muted-foreground">
              Powered by iExec Nox Protocol on Arbitrum. Enterprise-grade security meets decentralised finance — without exposing business logic on-chain.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <Button
                onClick={() => connect()}
                size="lg"
                className="cta-cyan group h-12 rounded-full px-7 text-sm font-bold uppercase tracking-[0.14em] hover:bg-cyan-gradient"
              >
                Connect Wallet
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <a
                href="#features"
                className="group inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                View features
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-accent" /> iExec Nox TEE</span>
              <span className="h-3 w-px bg-hairline" />
              <span className="inline-flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-accent" /> Arbitrum L2</span>
              <span className="h-3 w-px bg-hairline" />
              <span className="inline-flex items-center gap-2"><EyeOff className="h-3.5 w-3.5 text-accent" /> Zero-knowledge</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <article className="card-elevated group relative col-span-1 overflow-hidden p-6 lg:col-span-2 lg:row-span-2">
            <div className="flex items-start justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent ring-1 ring-accent/20">
                <FileLock2 className="h-4 w-4" />
              </div>
              <EncryptionPill state="sealed" />
            </div>
            <h3 className="font-display mt-6 text-xl font-semibold tracking-tight">Encrypted Invoicing</h3>
            <p className="mt-2.5 max-w-md text-sm leading-relaxed text-muted-foreground">
              Issue and settle invoices without revealing transaction details to the public ledger. Your business logic remains completely proprietary inside iExec Nox enclaves.
            </p>
            <div className="mt-8 rounded-xl border border-hairline bg-secondary/40 p-4">
              <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">INV — 0x8af3…91c2</span>
                <EncryptionPill state="verified" />
              </div>
              <div className="mt-3.5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Recipient</p>
                  <RedactedValue value="acme-corp.eth" className="mt-1" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Amount</p>
                  <RedactedValue value="124,500.00 USDC" className="mt-1" />
                </div>
              </div>
            </div>
          </article>

          <article className="card-elevated relative overflow-hidden p-6">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Data Exposure</p>
            <p className="font-display mt-3 text-5xl font-bold tracking-tight">0<span className="ml-1 text-xl font-semibold text-muted-foreground"> bytes</span></p>
            <p className="mt-2.5 text-sm text-muted-foreground">Zero-knowledge proofs guarantee no business data ever touches the public chain.</p>
            <div className="mt-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-accent">
              <span className="pulse-dot" /> Live attestation
            </div>
          </article>

          <article className="card-confidential p-6">
            <div className="relative flex items-start justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent ring-1 ring-accent/30">
                <Users className="h-4 w-4" />
              </div>
              <EncryptionPill state="encrypting" />
            </div>
            <h3 className="font-display relative mt-6 text-xl font-semibold tracking-tight text-confidential-foreground">Hidden Payroll</h3>
            <p className="relative mt-2.5 text-sm leading-relaxed text-confidential-foreground/70">Disburse salaries directly to employee wallets. No amounts, recipients, or schedules ever leak.</p>
            <div className="relative mt-5 space-y-2 border-t border-white/5 pt-4">
              {[["•••• 9c2a", "•••• USDC"], ["•••• 3f81", "•••• USDC"], ["•••• d4e7", "•••• USDC"]].map(([a, b], i) => (
                <div key={i} className="flex items-center justify-between font-mono text-[11px] text-confidential-foreground/60">
                  <span>{a}</span><span>{b}</span>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-5 rounded-2xl border border-hairline bg-card p-6 shadow-soft md:flex-row">
          <div className="flex items-center gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-gradient shadow-cta">
              <ShieldCheck className="h-5 w-5 text-primary" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display text-base font-semibold tracking-tight">Protected by iExec Nox</p>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Trusted Execution Environment · Arbitrum Sepolia</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="pulse-dot" />
            <span className="text-sm font-medium text-muted-foreground">Enclave online · PaySec deployed</span>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default Index;
