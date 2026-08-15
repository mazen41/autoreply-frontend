import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standard webpack instead of turbopack to avoid font issues
  // turbopack: {
  //   root: process.cwd(),
  // },
  
  // Disable source maps in development for faster builds
  productionBrowserSourceMaps: false,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Optimize CSS
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
