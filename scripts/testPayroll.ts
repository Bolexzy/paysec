import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";

async function main() {
  const connection = await hre.network.create();
  const { ethers } = connection;

  const [employer] = await ethers.getSigners();
  const contractAddress = process.env.NOVAPAY_ADDRESS;
  const usdcAddress = process.env.USDC_ADDRESS;

  if (!contractAddress) throw new Error("NOVAPAY_ADDRESS not set in .env");
  if (!usdcAddress) throw new Error("USDC_ADDRESS not set in .env");

  const recipients = (process.env.PAYROLL_RECIPIENTS ?? employer.address)
    .split(",")
    .map(address => address.trim())
    .filter(Boolean);
  const salaryInputs = (process.env.PAYROLL_AMOUNTS ?? "0.01")
    .split(",")
    .map(amount => amount.trim())
    .filter(Boolean);

  if (recipients.length !== salaryInputs.length) {
    throw new Error("PAYROLL_RECIPIENTS and PAYROLL_AMOUNTS must have the same length");
  }

  const amounts = salaryInputs.map(amount => ethers.parseUnits(amount, 6));
  const total = amounts.reduce((sum, amount) => sum + amount, 0n);

  const novaPay = await ethers.getContractAt("NovaPay", contractAddress);
  const usdc = await ethers.getContractAt(
    [
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function balanceOf(address account) external view returns (uint256)",
      "function allowance(address owner, address spender) external view returns (uint256)",
    ],
    usdcAddress
  );

  console.log("Testing payroll flow...");
  console.log("Employer:", employer.address);
  console.log("Contract:", contractAddress);
  console.log("Recipients:", recipients.join(", "));
  console.log("Total:", ethers.formatUnits(total, 6), "USDC");

  const balance = await usdc.balanceOf(employer.address);
  if (balance < total) {
    throw new Error(
      `Insufficient USDC: have ${ethers.formatUnits(balance, 6)}, need ${ethers.formatUnits(total, 6)}`
    );
  }

  const currentAllowance = await usdc.allowance(employer.address, contractAddress);
  if (currentAllowance < total) {
    const approveTx = await usdc.approve(contractAddress, total);
    const approveReceipt = await approveTx.wait();
    console.log("USDC approved. Tx:", approveReceipt?.hash);
  } else {
    console.log("USDC allowance already sufficient.");
  }

  const tx = await novaPay.runPayroll(recipients, amounts);
  const receipt = await tx.wait();
  console.log("Payroll transaction mined. Tx:", receipt?.hash);

  let runId: string | undefined;
  for (const log of receipt?.logs ?? []) {
    try {
      const parsed = novaPay.interface.parseLog(log);
      if (parsed?.name === "PayrollRunEvent") {
        runId = parsed.args.runId as string;
        break;
      }
    } catch {
      // Skip logs emitted by USDC/cUSDC.
    }
  }

  if (!runId) throw new Error("Could not find PayrollRunEvent");

  const [storedRecipients, timestamp] = await novaPay.getPayrollRunDetails(runId);
  console.log("Run ID:", runId);
  console.log("Stored recipient count:", storedRecipients.length);
  console.log("Timestamp:", timestamp.toString());

  for (const recipient of recipients) {
    const found = storedRecipients.some(
      (stored: string) => stored.toLowerCase() === recipient.toLowerCase()
    );
    console.log(found ? "Recipient recorded:" : "Recipient missing:", recipient);
    if (!found) throw new Error(`Recipient missing from payroll run: ${recipient}`);
  }

  const runs = await novaPay.getMyPayrollRuns();
  const runRecorded = runs.some((stored: string) => stored.toLowerCase() === runId?.toLowerCase());
  if (!runRecorded) throw new Error("Payroll run was not recorded for employer");

  console.log("Payroll flow verified.");
  console.log("Each member was included in the confidential batch transfer.");
  console.log("Verify on Arbiscan: https://sepolia.arbiscan.io/tx/" + receipt?.hash);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
