import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ["bun:sqlite", "drizzle-orm"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
