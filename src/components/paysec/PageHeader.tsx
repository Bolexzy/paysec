import { type ReactNode } from "react";

export const PageHeader = ({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
    <div>
      <span className="eyebrow">
        <span className="pulse-dot" />
        {eyebrow}
      </span>
      <h1 className="font-display mt-3 text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{description}</p>
    </div>
    {children}
  </div>
);
