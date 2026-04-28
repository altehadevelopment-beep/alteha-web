import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['xlsx', 'cheerio'],
};

export default nextConfig;
