// agrotrust-az/src/utils/qr.ts

/**
 * QR utilities for AgroTrust AZ (MVP)
 *
 * Notes:
 * - Browsers do not provide a native QR encoder.
 * - To keep the hackathon build dependency-light and stable,
 *   we provide a simple, reliable approach:
 *     1) Build a remote QR image URL you can use in <img src="..." />
 *
 * If you later decide to add a local QR library (e.g., "qrcode"),
 * you can extend this file with a dataURL generator without changing
 * component call-sites.
 */

/**
 * A small, dependable public QR image provider.
 * You can swap this to another provider later if needed.
 */
const DEFAULT_QR_PROVIDER =
  "https://api.qrserver.com/v1/create-qr-code/";

export type QRErrorCorrection = "L" | "M" | "Q" | "H";

export type QROptions = {
  /**
   * Image size in px (square).
   */
  size?: number;

  /**
   * Extra white space around the QR code.
   * Provider-specific behaviour; kept for future local encoder use.
   */
  margin?: number;

  /**
   * Error correction level (provider may ignore).
   */
  ecc?: QRErrorCorrection;

  /**
   * Override provider endpoint.
   */
  providerBaseUrl?: string;
};

export function normaliseQrData(data: unknown): string {
  if (data === null || data === undefined) return "";
  return String(data).trim();
}

/**
 * Build a QR image URL to be used in <img src="...">.
 *
 * Example:
 *   const src = buildQrImageUrl("PP-12345");
 *   <img src={src} alt="Passport QR" />
 */
export function buildQrImageUrl(data: string, options: QROptions = {}): string {
  const value = normaliseQrData(data);

  const size = Math.max(64, Math.min(options.size ?? 180, 1024));
  const ecc = options.ecc ?? "M";
  const provider = options.providerBaseUrl ?? DEFAULT_QR_PROVIDER;

  // Provider expects:
  // - size like "180x180"
  // - data url-encoded
  // - ecc optional
  const params = new URLSearchParams();
  params.set("size", `${size}x${size}`);
  params.set("data", value);

  // Some providers accept "ecc"; harmless if ignored.
  params.set("ecc", ecc);

  return `${provider}?${params.toString()}`;
}

/**
 * Alias used by components for semantic clarity.
 */
export function getQrSrc(data: string, options?: QROptions) {
  return buildQrImageUrl(data, options);
}

/**
 * Open QR in a new tab (useful for quick demos).
 */
export function openQrInNewTab(data: string, options?: QROptions) {
  const src = getQrSrc(data, options);
  try {
    window.open(src, "_blank", "noopener,noreferrer");
  } catch {
    // ignore
  }
}

/**
 * Trigger a browser download of the QR image.
 * Works by creating an <a> element pointing to the provider URL.
 */
export function downloadQr(
  data: string,
  filename = "qr.png",
  options?: QROptions
) {
  const src = getQrSrc(data, options);

  try {
    const a = document.createElement("a");
    a.href = src;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch {
    // ignore
  }
}

/**
 * Create a compact, user-friendly QR label for UI.
 */
export function buildQrAltText(label: string, id?: string) {
  const l = String(label ?? "").trim();
  const i = String(id ?? "").trim();

  if (l && i) return `${l} QR • ${i}`;
  if (l) return `${l} QR`;
  if (i) return `QR • ${i}`;
  return "QR code";
}