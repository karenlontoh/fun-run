import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp ships a native binary — bundling it (the default) breaks that
  // binary's loading at runtime on Vercel. This tells Next.js to leave it
  // as a real require() from node_modules instead.
  serverExternalPackages: ["sharp"],
  // serverExternalPackages alone wasn't enough: Vercel's serverless function
  // file trace was still dropping sharp's native .so binaries (confirmed in
  // production: "ERR_DLOPEN_FAILED: libvips-cpp.so ... cannot open shared
  // object file"), even though they install fine. This forces them in.
  outputFileTracingIncludes: {
    "/api/race-photos/**": ["./node_modules/@img/**/*", "./node_modules/sharp/**/*"],
  },
};

export default nextConfig;
