import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export const RedactedValue = ({
  value,
  className,
  defaultMasked = true,
}: {
  value: string;
  className?: string;
  defaultMasked?: boolean;
}) => {
  const [masked, setMasked] = useState(defaultMasked);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="redact" data-masked={masked.toString()}>{value}</span>
      <button
        onClick={() => setMasked((m) => !m)}
        aria-label={masked ? "Reveal" : "Hide"}
        className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        {masked ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      </button>
    </span>
  );
};
