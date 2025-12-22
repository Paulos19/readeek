import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Pode ajustar este valor conforme necessário (ex: '20mb')
    },
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bzbrxkmhdxvh0b4p.public.blob.vercel-storage.com', // Domínio padrão do Vercel Blob
      },
    ],
  },
};

export default nextConfig;