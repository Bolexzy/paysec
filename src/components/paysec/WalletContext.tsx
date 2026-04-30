import { createContext, useContext, type ReactNode } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

interface WalletState {
  connected: boolean;
  address?: string;
  fullAddress?: `0x${string}`;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState | null>(null);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  return (
    <WalletContext.Provider
      value={{
        connected: isConnected,
        address: address ? `${address.slice(0, 6)}…${address.slice(-4)}` : undefined,
        fullAddress: address,
        connect: openConnectModal ?? (() => {}),
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
};
