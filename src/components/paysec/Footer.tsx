import { Logo } from "./Logo";

export const Footer = () => (
  <footer className="border-t border-hairline py-8">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
      <Logo tone="muted" />
      <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
        {["Privacy Policy", "Terms of Service", "Security Audit", "Documentation"].map((l) => (
          <a key={l} href="#" className="text-muted-foreground transition-colors hover:text-foreground">{l}</a>
        ))}
      </nav>
      <p className="text-xs text-muted-foreground">© 2026 PaySec Protocol · Confidentiality by Design</p>
      <p className="text-[10px] text-muted-foreground/50 md:hidden lg:block">formerly NovaPay</p>
    </div>
  </footer>
);
