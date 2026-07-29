/**
 * Standalone QR Code Generator for OnlyExplore PDF Export
 * Generates Google Chart / QuickChart API QR Code image URLs or Data URIs.
 */

export function generateQRCodeUrl(text: string, size = 200): string {
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`;
}

export function generateTripShareUrl(shareKeyOrDestination: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || "https://onlyexplore.app";
  return `${baseUrl}/destination/${encodeURIComponent(shareKeyOrDestination.toLowerCase())}`;
}
