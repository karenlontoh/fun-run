import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp ships a native binary — bundling it (the default) breaks that
  // binary's loading at runtime on Vercel. This tells Next.js to leave it
  // as a real require() from node_modules instead.
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
