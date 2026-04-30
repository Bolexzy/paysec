import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export const Logo = ({ tone = "default" }: { tone?: "default" | "muted" }) => (
  <Link to="/" className="group inline-flex items-center gap-2.5">
    <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-cyan shadow-cta">
      <ShieldCheck className="h-4 w-4 text-primary" strokeWidth={2.5} />
      <span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-foreground/10" />
    </span>
    <span className={`font-display text-[17px] font-bold tracking-tight ${tone === "muted" ? "text-muted-foreground" : "text-foreground"}`}>
      PaySec
    </span>
  </Link>
);
