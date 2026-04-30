import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arbitrumSepolia } from "wagmi/chains";
import { defineChain } from "viem";
import { http } from "wagmi";

const arbitrumSepoliaConfig = defineChain({
  ...arbitrumSepolia,
  fees: { baseFeeMultiplier: 2 },
});

const alchemyRpc = import.meta.env.VITE_ALCHEMY_RPC as string | undefined;

export const wagmiConfig = getDefaultConfig({
  appName: "PaySec",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "paysec-dev",
  chains: [arbitrumSepoliaConfig],
  // Use Alchemy if configured — supports unlimited getLogs range (no block chunking needed)
  transports: alchemyRpc
    ? { [arbitrumSepoliaConfig.id]: http(alchemyRpc) }
    : undefined,
  ssr: false,
});
