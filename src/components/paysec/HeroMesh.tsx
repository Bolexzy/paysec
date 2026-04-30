export const HeroMesh = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-hero" />
    <div className="absolute inset-x-0 top-0 h-[640px] hero-mesh" />
    <div className="absolute left-1/2 top-[120px] h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
  </div>
);
