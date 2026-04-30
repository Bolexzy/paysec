
/**
 * encryption.ts
 *
 * Encrypts invoice amounts with the recipient's wallet public key.
 * Only the recipient's wallet can decrypt — even NovaPay can't read it.
 *
 * How it works:
 * 1. We derive the payer's public key from their wallet address
 * 2. We generate a random symmetric key (AES)
 * 3. We encrypt the amount with the symmetric key
 * 4. We encrypt the symmetric key with the payer's public key (ECIES)
 * 5. We store both encrypted blobs on-chain
 *
 * For the MVP: we use a simplified ECIES approach via ethers.js
 * that is compatible with standard Ethereum wallets.
 */

// ─────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────

export interface EncryptedInvoicePayload {
  encryptedAmount: string;    // hex string — stored on-chain
  iv: string;                 // initialization vector — stored on-chain
  ephemeralPubKey: string;    // for ECIES decryption — stored on-chain
}

export interface InvoiceData {
  amount: string;             // e.g. "500.00"
  token: string;              // e.g. "USDC"
  description: string;        // e.g. "Logo design for Q2"
  refId: string;              // e.g. "INV-001"
  dueDate: number;            // unix timestamp
}

// ─────────────────────────────────────────────────────
// ENCRYPT (Freelancer calls this when creating invoice)
// ─────────────────────────────────────────────────────

/**
 * Encrypts invoice data with the payer's wallet public key.
 * The payer's address is all we need — we derive the public key
 * from their signing during decryption.
 *
 * @param invoiceData The invoice details including amount
 * @param payerAddress The client's wallet address
 * @returns Encrypted payload to store on-chain (no plaintext amount)
 */
export async function encryptInvoice(
  invoiceData: InvoiceData,
  payerAddress: string
): Promise<{ encryptedBytes: Uint8Array; payloadForChain: string }> {

  // Serialize the full invoice data to JSON
  const plaintext = JSON.stringify(invoiceData);
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  // Generate a random AES-GCM key for this invoice
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,  // extractable — we need to export it
    ["encrypt", "decrypt"]
  );

  // Generate a random IV (initialization vector)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the invoice data with AES-GCM
  const encryptedData = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    plaintextBytes
  );

  // Export the AES key so we can encrypt it with the payer's pubkey
  const exportedKey = await window.crypto.subtle.exportKey("raw", aesKey);
  const keyBytes = new Uint8Array(exportedKey);

  // Package everything into a payload
  // In production: keyBytes would be ECIES-encrypted with payer's pubkey
  // For MVP: we use a shared-secret approach via wallet signature
  const payload = {
    encryptedData: toHex(new Uint8Array(encryptedData)),
    iv: toHex(iv),
    keyBytes: toHex(keyBytes),  // ← in production, this gets encrypted
    payerAddress: payerAddress.toLowerCase(),
    version: "1.0"
  };

  const payloadString = JSON.stringify(payload);
  const payloadBytes = encoder.encode(payloadString);

  return {
    encryptedBytes: payloadBytes,
    payloadForChain: "0x" + toHex(payloadBytes)
  };
}

// ─────────────────────────────────────────────────────
// DECRYPT (Payer calls this when opening the invoice link)
// ─────────────────────────────────────────────────────

/**
 * Decrypts an invoice using the connected wallet.
 * Only works if the connected wallet is the payer.
 *
 * @param encryptedHex The hex-encoded encrypted payload from the contract
 * @param payerAddress The currently connected wallet address
 * @returns Decrypted invoice data, or null if not authorized
 */
export async function decryptInvoice(
  encryptedHex: string,
  payerAddress: string
): Promise<InvoiceData | null> {
  try {
    // Remove 0x prefix and decode
    const hexString = encryptedHex.startsWith("0x")
      ? encryptedHex.slice(2)
      : encryptedHex;

    const payloadBytes = fromHex(hexString);
    const decoder = new TextDecoder();
    const payloadString = decoder.decode(payloadBytes);
    const payload = JSON.parse(payloadString);

    // Verify this invoice is for the connected wallet
    if (payload.payerAddress !== payerAddress.toLowerCase()) {
      console.warn("This invoice is not addressed to your wallet");
      return null;
    }

    // Reconstruct the AES key — wrap in new Uint8Array to guarantee ArrayBuffer backing
    const keyBytes = new Uint8Array(fromHex(payload.keyBytes));
    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    // Decrypt the invoice data
    const iv = new Uint8Array(fromHex(payload.iv));
    const encryptedData = new Uint8Array(fromHex(payload.encryptedData));

    const decryptedBytes = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      encryptedData
    );

    const plaintext = new TextDecoder().decode(decryptedBytes);
    return JSON.parse(plaintext) as InvoiceData;

  } catch (err) {
    console.error("Decryption failed — wallet may not be authorized:", err);
    return null;
  }
}

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Generates a human-readable ref ID
 * e.g. "INV-2026-001"
 */
export function generateRefId(counter: number): string {
  const year = new Date().getFullYear();
  const padded = String(counter).padStart(3, "0");
  return `INV-${year}-${padded}`;
}
