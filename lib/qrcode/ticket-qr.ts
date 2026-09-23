import QRCode from "qrcode";

/**
 * Generate a QR code data URL for a booking or ticket payload.
 * Useful for movie ticket verification.
 */
export async function generateTicketQRCode(payload: string): Promise<string> {
  try {
    return await QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
  } catch (error) {
    console.error("Failed to generate ticket QR code:", error);
    throw error;
  }
}
