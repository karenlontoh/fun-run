import "server-only";
import sharp from "sharp";
import path from "path";
import { readFile } from "fs/promises";

const LOGO_PATH = path.join(process.cwd(), "public", "logo.png");

// Overlays the Fun Run logo (semi-transparent, bottom-right) onto a race
// photo and re-encodes it as a JPEG — done once at upload time so viewing
// the gallery later never has to reprocess anything.
export async function applyWatermark(inputBuffer: Buffer): Promise<Buffer> {
  const image = sharp(inputBuffer).rotate();
  const { width = 1600, height = 1600 } = await image.metadata();

  const logoWidth = Math.round(Math.min(width, height) * 0.22);
  const logoMeta = await sharp(LOGO_PATH).metadata();
  const logoHeight = Math.round(logoWidth * ((logoMeta.height ?? 1) / (logoMeta.width ?? 1)));
  const logoBase64 = (await readFile(LOGO_PATH)).toString("base64");

  // Compositing an SVG wrapper (instead of the PNG directly) is what lets us
  // dial in opacity — sharp's composite() has no opacity option of its own.
  const svg = `<svg width="${logoWidth}" height="${logoHeight}" xmlns="http://www.w3.org/2000/svg">
    <image href="data:image/png;base64,${logoBase64}" width="${logoWidth}" height="${logoHeight}" opacity="0.65" />
  </svg>`;

  return image
    .composite([{ input: Buffer.from(svg), gravity: "southeast" }])
    .jpeg({ quality: 88 })
    .toBuffer();
}
