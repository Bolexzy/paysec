import { GlassNav } from "./GlassNav";
import { AppTabs } from "./AppTabs";
import { Footer } from "./Footer";

export const AppShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background text-foreground">
    <GlassNav />
    <AppTabs />
    <main>{children}</main>
    <Footer />
  </div>
);
