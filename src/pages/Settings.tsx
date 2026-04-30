import { AppShell } from "@/components/paysec/AppShell";
import { EncryptionPill } from "@/components/paysec/EncryptionPill";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2, AlertTriangle, Info, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useWallet } from "@/components/paysec/WalletContext";
import { NOVAPAY_ADDRESS } from "@/lib/contracts";
import { useChainGPTAudit, type AuditFinding } from "@/hooks/useChainGPTAudit";
import { useState } from "react";
import { cn } from "@/lib/utils";

const severityConfig = {
  critical: { color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", icon: AlertTriangle },
  high:     { color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20", icon: AlertTriangle },
  medium:   { color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20", icon: AlertTriangle },
  low:      { color: "text-accent", bg: "bg-accent/10 border-accent/20", icon: Info },
  info:     { color: "text-muted-foreground", bg: "bg-secondary/60 border-hairline", icon: Info },
};

const FindingRow = ({ f }: { f: AuditFinding }) => {
  const [open, setOpen] = useState(false);
  const cfg = severityConfig[f.severity] ?? severityConfig.info;
  const Icon = cfg.icon;
  return (
    <div className={cn("rounded-xl border p-4", cfg.bg)}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start justify-between gap-3 text-left">
        <div className="flex items-start gap-2">
          <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", cfg.color)} />
          <div>
            <span className={cn("text-[11px] font-bold uppercase tracking-wider", cfg.color)}>{f.severity}</span>
            <p className="mt-0.5 text-sm font-medium">{f.title}</p>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && <p className="mt-3 text-xs leading-relaxed text-muted-foreground pl-5">{f.description}</p>}
    </div>
  );
};

const Settings = () => {
  const { fullAddress } = useWallet();
  const shortAddr = fullAddress ? `${fullAddress.slice(0, 6)}…${fullAddress.slice(-4)}` : "—";
  const { runAudit, loading, report, error } = useChainGPTAudit();
  const hasApiKey = !!import.meta.env.VITE_CHAINGPT_API_KEY;

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-6 py-8">
        <p className="eyebrow"><span className="pulse-dot" />Configuration</p>
        <h1 className="font-display mt-3 text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Tune your confidentiality, attestation, and signing preferences.</p>

        <div className="mt-7 space-y-4">
          {/* Enclave info */}
          <div className="card-elevated p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-base font-semibold tracking-tight">iExec Nox Enclave</h2>
                <p className="mt-1 text-sm text-muted-foreground">All sensitive computation is sealed inside the TEE.</p>
              </div>
              <EncryptionPill state="verified" />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                ["Connected wallet", shortAddr],
                ["PaySec contract", `${NOVAPAY_ADDRESS.slice(0, 6)}…${NOVAPAY_ADDRESS.slice(-4)}`],
                ["Network", "Arbitrum Sepolia · 421614"],
                ["Region", "eu-west-1 · sgx"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-hairline bg-secondary/40 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{k}</p>
                  <p className="mt-1 font-mono text-sm">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy preferences */}
          <div className="card-elevated p-5">
            <h2 className="font-display text-base font-semibold tracking-tight">Privacy Preferences</h2>
            <div className="mt-4 divide-y divide-hairline">
              {[
                { id: "mask", label: "Mask amounts by default", desc: "Always blur monetary values until hovered." },
                { id: "auto-seal", label: "Auto-seal new invoices", desc: "Apply Nox encryption immediately on creation." },
                { id: "stealth", label: "Stealth payroll mode", desc: "Hide recipient identities even from internal logs." },
              ].map((p) => (
                <div key={p.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div>
                    <Label htmlFor={p.id} className="text-sm font-medium">{p.label}</Label>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                  <Switch id={p.id} defaultChecked />
                </div>
              ))}
            </div>
          </div>

          {/* ChainGPT Smart Contract Audit */}
          <div className="card-elevated p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-semibold tracking-tight">Smart Contract Audit</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Run an AI-powered security audit of the PaySec contract via ChainGPT.
                  {!hasApiKey && (
                    <span className="ml-1 text-accent">
                      Demo mode — add <code className="font-mono text-xs">VITE_CHAINGPT_API_KEY</code> for live results.
                    </span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={`https://sepolia.arbiscan.io/address/${NOVAPAY_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-soft transition-colors hover:text-foreground"
                >
                  <ExternalLink className="h-3 w-3" /> Arbiscan
                </a>
                <Button
                  onClick={runAudit}
                  disabled={loading || !!report}
                  className="cta-cyan h-9 rounded-full px-4 text-xs font-bold uppercase tracking-wider hover:bg-cyan-gradient"
                >
                  {loading ? (
                    <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Auditing…</>
                  ) : report ? (
                    <><ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Audited</>
                  ) : (
                    <><ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Audit Contract</>
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            {loading && (
              <div className="mt-6 space-y-3">
                {["Fetching contract bytecode…", "Analysing with ChainGPT AI…", "Compiling findings…"].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                    <span className="font-mono text-xs text-muted-foreground">{step}</span>
                  </div>
                ))}
              </div>
            )}

            {report && (
              <div className="mt-6 space-y-4">
                {/* Score */}
                <div className="flex items-center gap-4 rounded-xl border border-hairline bg-secondary/40 p-4">
                  <div className="relative grid h-14 w-14 shrink-0 place-items-center">
                    <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--hairline))" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--accent))" strokeWidth="3"
                        strokeDasharray={`${(report.score / 100) * 94.2} 94.2`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute font-mono text-sm font-bold">{report.score}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Security Score</p>
                    <p className="mt-1 text-sm leading-relaxed">{report.summary}</p>
                  </div>
                </div>

                {/* Findings */}
                {report.findings.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {report.findings.length} Finding{report.findings.length !== 1 ? "s" : ""}
                    </p>
                    {report.findings.map((f, i) => <FindingRow key={i} f={f} />)}
                  </div>
                )}

                <p className="font-mono text-[10px] text-muted-foreground">
                  {hasApiKey ? "Powered by ChainGPT AI" : "Demo report — add VITE_CHAINGPT_API_KEY for live audit"} · {new Date(report.generatedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Trust anchor */}
          <div className="card-confidential p-5">
            <div className="relative flex items-center gap-4">
              <ShieldCheck className="h-6 w-6 text-accent" />
              <div>
                <p className="font-display text-base font-semibold text-confidential-foreground">Enclave trust anchor</p>
                <p className="font-mono text-xs uppercase tracking-wider text-confidential-foreground/60">Verified by iExec · Arbitrum Sepolia testnet</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default Settings;
