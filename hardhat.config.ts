import "dotenv/config";
import type { HardhatUserConfig } from "hardhat/config";
import hardhatToolbox from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

const privateKey = process.env.PRIVATE_KEY
  ? (process.env.PRIVATE_KEY.startsWith("0x") ? process.env.PRIVATE_KEY : `0x${process.env.PRIVATE_KEY}`)
  : undefined;

const config: HardhatUserConfig = {
  plugins: [hardhatToolbox],
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
    },
    arbitrumSepolia: {
      type: "http",
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      accounts: privateKey ? [privateKey] : [],
    },
  },
  verify: {
    etherscan: {
      apiKey: process.env.ARBISCAN_API_KEY ?? "",
    },
  },
};

export default config;
