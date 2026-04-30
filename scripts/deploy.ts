import "@nomicfoundation/hardhat-ethers";
import hre from "hardhat";

async function main() {
  const connection = await hre.network.create();
  const { ethers } = connection;
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with wallet:", deployer.address);
  console.log(
    "Wallet balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // ── 1. cUSDC (ERC-7984 confidential USDC wrapper) on Arbitrum Sepolia ──
  const CONFIDENTIAL_TOKEN_ADDRESS = "0x1ccec6bc60db15e4055d43dc2531bb7d4e5b808e";

  // ── 2. USDC on Arbitrum Sepolia ──
  const USDC_SEPOLIA = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";

  // ── 3. Deploy NovaPay ──
  console.log("\nDeploying NovaPay...");
  const NovaPay = await ethers.getContractFactory("NovaPay");
  const novaPay = await NovaPay.deploy(
    CONFIDENTIAL_TOKEN_ADDRESS,
    USDC_SEPOLIA
  );
  await novaPay.waitForDeployment();

  const novaPayAddress = await novaPay.getAddress();
  console.log("✅ NovaPay deployed to:", novaPayAddress);
  console.log("\n─────────────────────────────────────");
  console.log("SAVE THESE ADDRESSES:");
  console.log("NovaPay:            ", novaPayAddress);
  console.log("ConfidentialToken:  ", CONFIDENTIAL_TOKEN_ADDRESS);
  console.log("Base Token (USDC):  ", USDC_SEPOLIA);
  console.log("─────────────────────────────────────\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });