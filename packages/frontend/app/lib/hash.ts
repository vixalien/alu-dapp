/**
 * Compute SHA-256 hash of a file using the Web Crypto API.
 * Returns a 0x-prefixed 64-character hex string (bytes32 format).
 * No server required — runs entirely in the browser.
 */
export async function hashFile(file: File): Promise<string> {
  return hashBuffer(await file.arrayBuffer());
}

export async function hashBuffer(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return "0x" + hex;
}

export function isValidBytes32(value: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}
