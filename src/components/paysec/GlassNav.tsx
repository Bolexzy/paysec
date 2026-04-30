import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, LogOut, Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useWallet } from "./WalletContext";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/settings", label: "Settings" },
];

export const GlassNav = () => {
  const { connected, address, connect, disconnect } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="glass-nav sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />

          {/* Desktop nav links */}
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `relative px-4 py-2 text-sm font-medium transition-colors ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`
                }
              >
                {({ isActive }) => (
                  <>
                    {l.label}
                    {isActive && <span className="absolute inset-x-3 -bottom-px h-px bg-gradient-cyan" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Desktop wallet UI */}
            {connected ? (
              <div className="hidden items-center gap-2 sm:flex">
                <div className="inline-flex items-center gap-2 rounded-full border border-hairline bg-card px-3.5 py-1.5 shadow-soft">
                  <span className="pulse-dot" />
                  <span className="font-mono text-xs text-foreground">{address}</span>
                </div>
                <button
                  onClick={disconnect}
                  aria-label="Disconnect"
                  className="grid h-9 w-9 place-items-center rounded-full border border-hairline bg-card text-muted-foreground shadow-soft transition-colors hover:border-destructive/40 hover:text-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <Button
                onClick={connect}
                variant="outline"
                className="hidden h-9 rounded-full border-accent/40 bg-background px-4 text-sm font-semibold text-foreground shadow-soft hover:border-accent hover:bg-accent-soft sm:inline-flex"
              >
                Connect Wallet
                <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            )}

            {/* Mobile: connect or disconnect button */}
            {!connected ? (
              <Button
                onClick={connect}
                className="cta-cyan h-8 rounded-full px-3 text-xs font-bold sm:hidden"
              >
                Connect
              </Button>
            ) : (
              <button
                onClick={() => setMobileOpen((o) => !o)}
                aria-label="Menu"
                className="grid h-9 w-9 place-items-center rounded-full border border-hairline bg-card text-muted-foreground shadow-soft sm:hidden"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="border-t border-hairline bg-background/95 backdrop-blur-md sm:hidden">
            <div className="mx-auto max-w-7xl space-y-1 px-4 py-3">
              <div className="flex items-center gap-2 rounded-xl border border-hairline bg-card px-4 py-3 mb-2">
                <span className="pulse-dot" />
                <span className="font-mono text-xs text-foreground">{address}</span>
                <button onClick={disconnect} aria-label="Disconnect" className="ml-auto text-muted-foreground hover:text-destructive">
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-accent-soft text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
