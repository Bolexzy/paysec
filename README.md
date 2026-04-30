# PaySec — Confidential Web3 Payments

A privacy-first B2B payment platform built on iExec's Trusted Execution Environment (TEE). PaySec lets businesses send invoices, pay salaries, and settle transactions on-chain without exposing sensitive financial figures to the public blockchain.

Built for the **DoraHacks iExec Vibe-Coding Hackathon** · Deployed on **Arbitrum Sepolia**

---

## The Problem

Every on-chain payment is fully transparent — anyone can see amounts, frequency, and counterparties. This is a blocker for:

- **Businesses paying employees** — salary figures become public
- **Freelancers sending invoices** — rates visible to competitors
- **B2B payments** — commercial terms exposed on-chain

---

## How PaySec Solves It

PaySec uses iExec's **Nox Protocol** (ERC-7984 confidential tokens + TEE-sealed computation) to encrypt amounts end-to-end. Payment proof is recorded on-chain; the amount never is.

### Core Features

| Feature | What it does |
|---|---|
| **Private Send** | Wrap USDC into cUSDC via iExec Nox and send confidentially |
| **Confidential Invoicing** | Create invoices with AES-encrypted amounts; only the payer can decrypt |
| **Batch Payroll** | Run sealed salary payments to multiple wallets in one transaction |
| **Audit Proof** | Generate a shareable payment proof (tx hash + block + timestamp) — confirms payment without revealing amount |
| **Smart Contract Audit** | AI-powered security scan of the PaySec contract via ChainGPT |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity + Hardhat 3 |
| Confidential Computing | iExec Nox Protocol (ERC-7984, TFHE, NoxCompute) |
| Chain | Arbitrum Sepolia (421614) |
| Frontend | Vite + React + TypeScript + Tailwind CSS v3 |
| Wallet | RainbowKit + wagmi |
| Encryption | Web Crypto API (AES-GCM) |
| Security Audit | ChainGPT Smart Contract Auditor |

---

## Contract

**PaySec** — `0xF802a2ba4e80d6Ec9A2EC9142bD2De21F7378F89`  
[View on Arbiscan](https://sepolia.arbiscan.io/address/0xF802a2ba4e80d6Ec9A2EC9142bD2De21F7378F89)

Key functions:
- `wrapAndSend(recipient, amount)` — confidential USDC transfer via Nox
- `createInvoice(payer, encryptedAmount, refId, dueDate)` — create a sealed invoice
- `payInvoice(invoiceId, amount)` — settle an invoice
- `runPayroll(recipients[], amounts[])` — batch confidential salary run

---

## Setup

```bash
# Install dependencies
npm install

# Copy env template and fill in values
cp .env.example .env

# Run frontend
npm run dev

# Deploy contract (Arbitrum Sepolia)
npx hardhat run scripts/deploy.ts --network arbitrumSepolia
```

### Environment Variables

See `.env.example` for all required variables. Key ones:

```
VITE_NOVAPAY_ADDRESS=0xF802a2ba4e80d6Ec9A2EC9142bD2De21F7378F89
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
VITE_CHAINGPT_API_KEY=your_chaingpt_key   # optional — demo mode if omitted
VITE_ALCHEMY_RPC=https://arb-sepolia.g.alchemy.com/v2/your_key  # optional
```

---

## Privacy Model

- Invoice amounts are encrypted client-side (AES-GCM) before any chain interaction
- Only the payer's wallet can decrypt — no plaintext amount ever touches the chain or a server
- `PrivateSent` and `InvoicePaid` events confirm payment happened; no amount field is emitted
- iExec Nox TEE seals computation — even the node operator can't read values
- Audit proofs are shareable URLs containing tx hash + block + timestamp only

---

## Project Structure

```
src/
├── components/paysec/   # UI components (GlassNav, AuditProof, AmountDisplay, …)
├── hooks/
│   ├── usePaySec.ts     # All contract write hooks with gas overrides
│   └── useChainGPTAudit.ts
├── lib/
│   ├── contracts.ts     # ABI + contract address
│   ├── encryption.ts    # AES-GCM encrypt/decrypt
│   ├── invoiceLink.ts   # ?id= link generation
│   └── wagmi.config.ts  # RainbowKit + wagmi setup
└── pages/
    ├── Index.tsx        # Landing page
    ├── Dashboard.tsx    # Payment activity overview
    ├── Send.tsx         # Private send flow
    ├── Received.tsx     # Incoming payments
    ├── Invoices.tsx     # Invoice management
    ├── Payroll.tsx      # Batch payroll
    └── Settings.tsx     # ChainGPT audit + enclave config
```

---

> **Note:** PaySec was formerly developed under the working title **NovaPay**. References to `NOVAPAY_ADDRESS`, `NOVAPAY_ABI`, and related env variables in the codebase are contract identifiers that predate the rename — they remain unchanged to preserve compatibility with the deployed contract and existing environment configurations.
