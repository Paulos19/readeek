import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Pode ajustar este valor conforme necessário (ex: '20mb')
    },
  },
  /* outras configurações que você possa ter */
};

export default nextConfig;