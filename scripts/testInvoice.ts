import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";

async function main() {
  const connection = await hre.network.create();
  const { ethers } = connection;

  const [freelancer] = await ethers.getSigners();
  const payer = freelancer; // single key on testnet — same wallet acts as both sides

  const CONTRACT_ADDRESS = process.env.NOVAPAY_ADDRESS as `0x${string}`;
  if (!CONTRACT_ADDRESS) throw new Error("NOVAPAY_ADDRESS not set in .env");

  const novaPay = await ethers.getContractAt("NovaPay", CONTRACT_ADDRESS);

  console.log("Testing invoice flow...");
  console.log("Wallet:", freelancer.address);
  console.log("Contract:", CONTRACT_ADDRESS);

  // Simulate encrypted amount (in real app, encryption.ts handles this)
  const fakeEncryptedAmount = ethers.toUtf8Bytes(
    JSON.stringify({ encrypted: "AES_ENCRYPTED_BLOB_HERE" })
  );

  const dueDate = Math.floor(Date.now() / 1000) + 86400 * 7; // 7 days from now

  // Create invoice
  const tx = await novaPay.createInvoice(
    payer.address,
    fakeEncryptedAmount,
    "INV-2026-001",
    dueDate
  );
  const receipt = await tx.wait();
  console.log("✅ Invoice created. Tx:", receipt?.hash);

  // Extract invoiceId from InvoiceCreated event
  let invoiceId: string | undefined;
  for (const log of receipt?.logs ?? []) {
    try {
      const parsed = novaPay.interface.parseLog(log);
      if (parsed?.name === "InvoiceCreated") {
        invoiceId = parsed.args[0] as string;
        break;
      }
    } catch { /* skip unparseable logs */ }
  }

  if (!invoiceId) {
    console.error("❌ Could not find InvoiceCreated event");
    return;
  }

  console.log("📋 Invoice ID:", invoiceId);
  console.log("🔗 Share link: http://localhost:5173/pay?id=" + invoiceId);

  // Read invoice from chain (public mapping)
  const invoice = await novaPay.invoices(invoiceId);
  console.log("📊 Invoice on-chain:");
  console.log("   Creator:", invoice.creator);
  console.log("   Payer:  ", invoice.payer);
  console.log("   RefId:  ", invoice.refId);
  console.log("   Paid:   ", invoice.paid);

  // NOTE: payInvoice requires USDC allowance + cUSDC wrapper approval.
  // To test the full pay flow, run against a funded wallet with USDC on Arbitrum Sepolia.
  // Uncomment when ready:
  //
  const USDC_ADDRESS = process.env.USDC_ADDRESS as string;
  const usdc = await ethers.getContractAt(
    ["function approve(address spender, uint256 amount) external returns (bool)"],
    USDC_ADDRESS
  );
  const amount = ethers.parseUnits("10", 6); // 10 USDC
  await usdc.approve(CONTRACT_ADDRESS, amount);
  const payTx = await novaPay.payInvoice(invoiceId, amount);
  const payReceipt = await payTx.wait();
  console.log("✅ Invoice paid! Tx:", payReceipt?.hash);

  // Read updated invoice status
  const paidInvoice = await novaPay.invoices(invoiceId);
  console.log("\n📊 Final invoice status:");
  console.log("   Paid:    ", paidInvoice.paid ? "✅ PAID" : "❌ UNPAID");
  console.log("   Amount:  ", ethers.formatUnits(amount, 6), "USDC");
  console.log("   Creator: ", paidInvoice.creator);
  console.log("   Payer:   ", paidInvoice.payer);
  console.log("\n🔍 Verify on Arbiscan:");
  console.log("   https://sepolia.arbiscan.io/tx/" + payReceipt?.hash);
}

main().catch(console.error);
