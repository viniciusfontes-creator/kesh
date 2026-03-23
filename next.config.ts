import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['ai', '@ai-sdk/react', '@ai-sdk/google'],
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'kesh-ai.vercel.app',
          },
        ],
        destination: 'https://keshai.vercel.app/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
