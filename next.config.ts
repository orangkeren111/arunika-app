import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb", // Sesuaikan dengan ukuran maksimal PDF-mu
    },
  },
};

export default nextConfig;
