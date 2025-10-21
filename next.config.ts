import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    // Ignore Supabase functions directory during build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/supabase/functions/**'],
    };
    
    return config;
  },
  // Exclude Supabase functions from TypeScript compilation
  typescript: {
    ignoreBuildErrors: false,
  },
  // Exclude Supabase functions from ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
