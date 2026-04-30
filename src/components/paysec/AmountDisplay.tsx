import { useState, useEffect } from "react";
import { useWallet } from "@/components/paysec/WalletContext";
import { decryptInvoice } from "@/lib/encryption";
import { ConfidentialBadge } from "./ConfidentialBadge";
import { cn } from "@/lib/utils";

interface Props {
  // The hex-encoded encrypted payload from the chain (invoices()[2])
  encryptedAmount: string;
  // The on-chain authorized payer address
  payerAddress: string;
  className?: string;
}

type State = "idle" | "decrypting" | "revealed" | "hidden";

export const AmountDisplay = ({ encryptedAmount, payerAddress, className }: Props) => {
  const { fullAddress } = useWallet();
  const [state, setState] = useState<State>("idle");
  const [amount, setAmount] = useState<string | null>(null);

  const isAuthorized =
    !!fullAddress &&
    !!payerAddress &&
    fullAddress.toLowerCase() === payerAddress.toLowerCase();

  useEffect(() => {
    if (!isAuthorized || !fullAddress || !encryptedAmount || state !== "idle") return;
    setState("decrypting");
    decryptInvoice(encryptedAmount, fullAddress)
      .then((data) => {
        if (data?.amount) {
          setAmount(data.amount);
          setState("revealed");
        } else {
          setState("hidden");
        }
      })
      .catch(() => setState("hidden"));
  }, [isAuthorized, fullAddress, encryptedAmount]);

  if (!isAuthorized) return <ConfidentialBadge className={className} />;

  if (state === "decrypting") {
    return (
      <span className={cn("font-mono text-xs italic text-muted-foreground", className)}>
        Decrypting…
      </span>
    );
  }

  if (state === "revealed" && amount) {
    return (
      <span className={cn("font-mono font-semibold text-accent", className)}>
        {amount} USDC
      </span>
    );
  }

  return <ConfidentialBadge className={className} />;
};
