import { NavLink } from "react-router-dom";
import { Send, Inbox, FileText, Users } from "lucide-react";
import { useWallet } from "./WalletContext";

const tabs = [
  { to: "/send", label: "Send", icon: Send },
  { to: "/received", label: "Received", icon: Inbox },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/payroll", label: "Payroll", icon: Users },
];

export const AppTabs = () => {
  const { connected } = useWallet();
  if (!connected) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-40 bg-transparent">
      <div className="mx-auto max-w-7xl px-6">
        <div className="pointer-events-auto mx-auto flex w-fit max-w-full items-center justify-start gap-1 overflow-x-auto rounded-full border border-hairline bg-background/80 p-1.5 shadow-elevated backdrop-blur-md sm:justify-center">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-cyan-gradient text-primary shadow-cta"
                    : "border border-hairline bg-card text-muted-foreground shadow-soft hover:text-foreground hover:border-accent/40"
                }`
              }
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};
