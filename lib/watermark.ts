import "server-only";
import sharp from "sharp";
import path from "path";
import { readFile } from "fs/promises";

const LOGO_PATH = path.join(process.cwd(), "public", "logo.png");

// Overlays the Fun Run logo (bottom-center, with margin from the edge) onto
// a race photo and re-encodes it as a JPEG. Done once at upload time so
// viewing the gallery later never has to reprocess anything.
export async function applyWatermark(inputBuffer: Buffer): Promise<Buffer> {
  // Auto-orient based on EXIF (phone/camera photos often store pixels in
  // landscape with a rotation flag) and bake that into a real buffer first —
  // reading metadata() off the un-materialized pipeline can still report
  // pre-rotation width/height, which silently swaps width/height and throws
  // off every position calculation below.
  const rotatedBuffer = await sharp(inputBuffer).rotate().toBuffer();
  const image = sharp(rotatedBuffer);
  const { width = 1600, height = 1600 } = await image.metadata();

  const logoMeta = await sharp(LOGO_PATH).metadata();
  const logoAspect = (logoMeta.height ?? 1) / (logoMeta.width ?? 1);
  const logoWidth = Math.round(Math.min(width, height) * 0.11);
  const logoHeight = Math.round(logoWidth * logoAspect);
  const logoBase64 = (await readFile(LOGO_PATH)).toString("base64");

  // Compositing an SVG wrapper (instead of the PNG directly) is what lets us
  // dial in opacity — sharp's composite() has no opacity option of its own.
  const svg = `<svg width="${logoWidth}" height="${logoHeight}" xmlns="http://www.w3.org/2000/svg">
    <image href="data:image/png;base64,${logoBase64}" width="${logoWidth}" height="${logoHeight}" opacity="0.8" />
  </svg>`;

  // Centered horizontally, with a bottom margin (3% of photo height) instead
  // of sitting flush against the edge.
  const bottomMargin = Math.round(height * 0.03);
  const left = Math.round((width - logoWidth) / 2);
  const top = height - logoHeight - bottomMargin;

  return image
    .composite([{ input: Buffer.from(svg), left, top }])
    .jpeg({ quality: 88 })
    .toBuffer();
}
