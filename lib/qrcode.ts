import "server-only";
import QRCode from "qrcode";

export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: 480,
    color: {
      dark: "#0b1b4f",
      light: "#ffffff",
    },
  });
}
