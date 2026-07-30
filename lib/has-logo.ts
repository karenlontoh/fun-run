import "server-only";
import fs from "node:fs";
import path from "node:path";

export function hasLogo(): boolean {
  return fs.existsSync(path.join(process.cwd(), "public", "logo.png"));
}
