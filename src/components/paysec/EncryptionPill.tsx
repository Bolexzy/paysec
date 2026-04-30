import { Check, Lock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type State = "encrypting" | "sealed" | "verified";

const config: Record<State, { label: string; icon: React.ElementType }> = {
  encrypting: { label: "Encrypting", icon: Shield },
  sealed: { label: "Sealed", icon: Lock },
  verified: { label: "Verified on Nox", icon: Check },
};

export const EncryptionPill = ({ state, className }: { state: State; className?: string }) => {
  const { label, icon: Icon } = config[state];

  if (state === "encrypting") {
    return (
      <span className={cn("relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-accent/30 bg-accent-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground", className)}>
        <span className="absolute inset-0 shimmer" aria-hidden />
        <Icon className="relative h-3 w-3 text-accent" />
        <span className="relative">{label}</span>
      </span>
    );
  }

  if (state === "sealed") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-cyan-gradient px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary shadow-cta", className)}>
        <Icon className="h-3 w-3" />
        {label}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-hairline bg-secondary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground", className)}>
      <Icon className="h-3 w-3 text-accent" />
      {label}
    </span>
  );
};
