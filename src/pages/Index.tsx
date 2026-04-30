import { AppShell } from "@/components/paysec/AppShell";
import { HeroMesh } from "@/components/paysec/HeroMesh";
import { EncryptionPill } from "@/components/paysec/EncryptionPill";
import { RedactedValue } from "@/components/paysec/RedactedValue";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/paysec/WalletContext";
import { ArrowRight, FileLock2, Users, EyeOff, ShieldCheck, Activity } from "lucide-react";

const Index = () => {
  const { connect } = useWallet();

  const handleConnect = () => connect();

  return (
    <AppShell>
      <section className="relative">
        <HeroMesh />
        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 md:pt-16">
          <div className="flex flex-col items-center text-center">
            <span className="eyebrow">
              <span className="pulse-dot" />
              Confidentiality by Design
            </span>

            <h1 className="font-display mt-7 max-w-4xl text-balance text-5xl font-bold leading-[1.05] tracking-tight text-foreground md:text-7xl lg:text-6xl xl:text-7xl">
              Private payments. Confidential invoices.{" "}
              <span className="bg-gradient-to-r from-accent to-accent-glow bg-clip-text text-transparent">
                Hidden payroll.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground lg:text-base xl:text-lg">
              Powered by iExec Nox Protocol on Arbitrum. Enterprise-grade security meets decentralized finance — without a single byte of business logic exposed on-chain.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <Button
                onClick={handleConnect}
                size="lg"
                className="cta-cyan group h-14 rounded-full px-8 text-sm font-bold uppercase tracking-[0.14em] hover:bg-cyan-gradient"
              >
                Connect Wallet
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <a
                href="#features"
                className="group inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                View documentation
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>

            <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs uppercase tracking-[0.18em] text-muted-foreground lg:gap-x-6 lg:text-[11px] xl:gap-x-8 xl:text-xs">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-accent" /> iExec Nox TEE</span>
              <span className="h-3 w-px bg-hairline" />
              <span className="inline-flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-accent" /> Arbitrum L2</span>
              <span className="h-3 w-px bg-hairline" />
              <span className="inline-flex items-center gap-2"><EyeOff className="h-3.5 w-3.5 text-accent" /> Zero-knowledge</span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative">
        <div className="mx-auto max-w-7xl px-6 pb-24">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-4 xl:gap-5">
            <article className="card-elevated group relative col-span-1 overflow-hidden p-8 lg:col-span-2 lg:row-span-2">
              <div className="flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent ring-1 ring-accent/20">
                  <FileLock2 className="h-5 w-5" />
                </div>
                <EncryptionPill state="sealed" />
              </div>
              <h3 className="font-display mt-8 text-2xl font-semibold tracking-tight lg:text-xl xl:text-2xl">Encrypted Invoicing</h3>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground lg:text-sm xl:text-[15px]">
                Issue and settle invoices without revealing transaction details to the public ledger. Your business logic remains completely proprietary inside iExec Nox enclaves.
              </p>
              <div className="mt-10 rounded-xl border border-hairline bg-secondary/40 p-5">
                <div className="flex items-center justify-between border-b border-hairline pb-3">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground lg:text-[11px] xl:text-xs">INV — 0x8af3…91c2</span>
                  <EncryptionPill state="verified" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm lg:text-xs xl:text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground lg:text-[11px] xl:text-xs">Recipient</p>
                    <RedactedValue value="acme-corp.eth" className="mt-1" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground lg:text-[11px] xl:text-xs">Amount</p>
                    <RedactedValue value="124,500.00 USDC" className="mt-1" />
                  </div>
                </div>
              </div>
            </article>

            <article className="card-elevated relative overflow-hidden p-8">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground lg:text-[11px] xl:text-xs">Data Exposure</p>
              <p className="font-display mt-3 text-6xl font-bold tracking-tight lg:text-5xl xl:text-6xl">0<span className="ml-1 text-2xl font-semibold text-muted-foreground lg:text-xl xl:text-2xl"> bytes</span></p>
              <p className="mt-3 text-sm text-muted-foreground lg:text-xs xl:text-sm">Zero-knowledge proofs guarantee no business data ever touches the public chain.</p>
              <div className="mt-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-accent lg:text-[10px] xl:text-[11px]">
                <span className="pulse-dot" /> Live attestation
              </div>
            </article>

            <article className="card-confidential p-8">
              <div className="relative flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent ring-1 ring-accent/30">
                  <Users className="h-5 w-5" />
                </div>
                <EncryptionPill state="encrypting" />
              </div>
              <h3 className="font-display relative mt-8 text-2xl font-semibold tracking-tight text-confidential-foreground lg:text-xl xl:text-2xl">Hidden Payroll</h3>
              <p className="relative mt-3 text-[15px] leading-relaxed text-confidential-foreground/70 lg:text-sm xl:text-[15px]">Disburse salaries directly to employee wallets stealthily. No amounts, recipients, or schedules ever leak.</p>
              <div className="relative mt-6 space-y-2.5 border-t border-white/5 pt-5">
                {[["•••• 9c2a", "•••• USDC"], ["•••• 3f81", "•••• USDC"], ["•••• d4e7", "•••• USDC"]].map(([a, b], i) => (
                  <div key={i} className="flex items-center justify-between font-mono text-xs text-confidential-foreground/60 lg:text-[11px] xl:text-xs">
                    <span>{a}</span><span>{b}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="mt-16 flex flex-col items-center justify-between gap-6 rounded-2xl border border-hairline bg-card p-8 shadow-soft md:flex-row">
            <div className="flex items-center gap-5">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-cyan-gradient shadow-cta">
                <ShieldCheck className="h-5 w-5 text-primary" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-display text-lg font-semibold tracking-tight lg:text-base xl:text-lg">Protected by iExec Nox</p>
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground lg:text-[11px] xl:text-xs">Trusted Execution Environment · Arbitrum Sepolia</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="pulse-dot" />
              <span className="text-sm font-medium text-muted-foreground lg:text-xs xl:text-sm">Enclave online · NovaPay deployed</span>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default Index;
