import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useEstimateFeesPerGas } from "wagmi";
import { parseUnits, parseAbi } from "viem";
import { NOVAPAY_ADDRESS, NOVAPAY_ABI } from "../lib/contracts";

const USDC_ADDRESS = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" as const;
const CUSDC_ADDRESS = "0x1ccec6bc60db15e4055d43dc2531bb7d4e5b808e" as const;
const USDC_DECIMALS = 6;

const ERC20_APPROVE_ABI = parseAbi([
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
]);

// Fetches current network fees and doubles maxFeePerGas to guarantee the tx
// clears the block base fee even on small fee spikes between estimation and inclusion.
function useGasOverrides() {
  const { data } = useEstimateFeesPerGas();
  if (!data?.maxFeePerGas) return {};
  return {
    maxFeePerGas: data.maxFeePerGas * 2n,
    maxPriorityFeePerGas: data.maxPriorityFeePerGas ?? 0n,
  };
}

// ─── APPROVE USDC ────────────────────────────────────
export function useApproveUSDC() {
  const gas = useGasOverrides();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (amountUSDC: string) =>
    writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_APPROVE_ABI,
      functionName: "approve",
      args: [NOVAPAY_ADDRESS, parseUnits(amountUSDC, USDC_DECIMALS)],
      ...gas,
    });

  return { approve, hash, isPending, isConfirming, isSuccess, error };
}

// ─── USDC ALLOWANCE ──────────────────────────────────
export function useUSDCAllowance() {
  const { address } = useAccount();
  return useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_APPROVE_ABI,
    functionName: "allowance",
    args: [address!, NOVAPAY_ADDRESS],
    query: { enabled: !!address },
  });
}

// ─── WRAP AND SEND ───────────────────────────────────
export function useWrapAndSend() {
  const gas = useGasOverrides();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const wrapAndSend = (recipient: `0x${string}`, amountUSDC: string) =>
    writeContract({
      address: NOVAPAY_ADDRESS,
      abi: NOVAPAY_ABI,
      functionName: "wrapAndSend",
      args: [recipient, parseUnits(amountUSDC, USDC_DECIMALS)],
      ...gas,
    });

  return { wrapAndSend, hash, isPending, isConfirming, isSuccess, error };
}

// ─── UNWRAP (called by recipient on cUSDC contract) ──
const CUSDC_ABI = parseAbi([
  "function unwrap(address from, address to, uint256 unwrapRequestId, bytes decryptedAmountAndProof) external",
]);

export function useUnwrap() {
  const { address } = useAccount();
  const gas = useGasOverrides();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const initiateUnwrap = (requestId: bigint, proof: `0x${string}`) =>
    writeContract({
      address: CUSDC_ADDRESS,
      abi: CUSDC_ABI,
      functionName: "unwrap",
      args: [address!, address!, requestId, proof],
      ...gas,
    });

  return { initiateUnwrap, hash, isPending, isConfirming, isSuccess, error };
}

// ─── CREATE INVOICE ──────────────────────────────────
export function useCreateInvoice() {
  const gas = useGasOverrides();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createInvoice = (
    payer: `0x${string}`,
    encryptedAmount: `0x${string}`,
    refId: string,
    dueDate: number
  ) =>
    writeContract({
      address: NOVAPAY_ADDRESS,
      abi: NOVAPAY_ABI,
      functionName: "createInvoice",
      args: [payer, encryptedAmount, refId, BigInt(dueDate)],
      gas: 500_000n,
      ...gas,
    });

  return { createInvoice, hash, isPending, isConfirming, isSuccess, error };
}

// ─── PAY INVOICE ─────────────────────────────────────
export function usePayInvoice() {
  const gas = useGasOverrides();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const payInvoice = (invoiceId: `0x${string}`, amountUSDC: string) =>
    writeContract({
      address: NOVAPAY_ADDRESS,
      abi: NOVAPAY_ABI,
      functionName: "payInvoice",
      args: [invoiceId, parseUnits(amountUSDC, USDC_DECIMALS)],
      gas: 500_000n,
      ...gas,
    });

  return { payInvoice, hash, isPending, isConfirming, isSuccess, error };
}

// ─── RUN PAYROLL ─────────────────────────────────────
export function useRunPayroll() {
  const gas = useGasOverrides();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const runPayroll = (recipients: `0x${string}`[], amountsUSDC: string[]) =>
    writeContract({
      address: NOVAPAY_ADDRESS,
      abi: NOVAPAY_ABI,
      functionName: "runPayroll",
      args: [
        recipients,
        amountsUSDC.map(a => parseUnits(a, USDC_DECIMALS)),
      ],
      gas: 1_000_000n,
      ...gas,
    });

  return { runPayroll, hash, isPending, isConfirming, isSuccess, error };
}
