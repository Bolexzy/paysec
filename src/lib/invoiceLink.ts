/**
 * invoiceLink.ts
 *
 * Generates and parses invoice share links.
 *
 * CRITICAL: The link NEVER contains the amount or any sensitive data.
 * It contains ONLY the on-chain invoice ID (a bytes32 hash).
 *
 * Link format: https://novapay.app/pay?id=0xabc123...
 *
 * Anyone with the link can see: "there is an invoice with this ID"
 * Only the payer's wallet can decrypt: the amount and terms
 */

// ─────────────────────────────────────────────────────
// GENERATE LINK
// ─────────────────────────────────────────────────────

/**
 * Generate a shareable invoice link from an on-chain invoice ID
 *
 * @param invoiceId bytes32 hex string from the contract event
 * @param baseUrl Your app's base URL (defaults to current origin)
 * @returns Full shareable URL — safe to send via email, Telegram, etc.
 */
export function generateInvoiceLink(
  invoiceId: string,
  baseUrl?: string
): string {
  const base = baseUrl || window.location.origin;

  const cleanId = invoiceId.startsWith("0x")
    ? invoiceId
    : `0x${invoiceId}`;

  return `${base}/invoices?id=${cleanId}`;
}

// ─────────────────────────────────────────────────────
// PARSE LINK
// ─────────────────────────────────────────────────────

/**
 * Extract the invoice ID from a payment URL
 *
 * @param url Full URL or just the query string
 * @returns invoiceId as bytes32 hex string, or null if invalid
 */
export function parseInvoiceLink(url?: string): string | null {
  try {
    const targetUrl = url || window.location.href;
    const parsed = new URL(targetUrl);
    const id = parsed.searchParams.get("id");

    if (!id) return null;

    const cleanId = id.startsWith("0x") ? id.slice(2) : id;
    if (!/^[0-9a-fA-F]{64}$/.test(cleanId)) {
      console.error("Invalid invoice ID format in URL");
      return null;
    }

    return id.startsWith("0x") ? id : `0x${id}`;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────
// COPY TO CLIPBOARD
// ─────────────────────────────────────────────────────

/**
 * Copy an invoice link to clipboard
 * Returns true if successful
 */
export async function copyInvoiceLink(invoiceId: string): Promise<boolean> {
  try {
    const link = generateInvoiceLink(invoiceId);
    await navigator.clipboard.writeText(link);
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────
// VALIDATE
// ─────────────────────────────────────────────────────

/**
 * Check if the current page URL is a valid invoice payment page
 */
export function isInvoicePaymentPage(): boolean {
  return parseInvoiceLink() !== null;
}

/**
 * Format invoice ID for display (shortened)
 * e.g. "0x1a2b3c...9xyz"
 */
export function formatInvoiceId(invoiceId: string): string {
  if (invoiceId.length <= 12) return invoiceId;
  return `${invoiceId.slice(0, 8)}...${invoiceId.slice(-6)}`;
}
