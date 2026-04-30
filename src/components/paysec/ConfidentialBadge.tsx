import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  size?: "sm" | "md";
  pulse?: boolean;
}

export const ConfidentialBadge = ({ className, size = "sm", pulse = false }: Props) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full bg-confidential font-bold uppercase tracking-wider text-confidential-foreground",
      size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
      className
    )}
  >
    <span className={cn("h-1.5 w-1.5 rounded-full bg-accent", pulse && "pulse-dot")} />
    Confidential
  </span>
);
