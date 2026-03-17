import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['ai', '@ai-sdk/react', '@ai-sdk/google'],
};

export default nextConfig;
