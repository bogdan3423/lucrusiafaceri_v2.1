import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lucru-si-afaceri.firebasestorage.app',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'ucarecdn.com',
      },
    ],
    // Allow unoptimized images as fallback
    unoptimized: false,
    // Optimize for faster loading
    minimumCacheTTL: 3600, // Cache images for 1 hour
    formats: ['image/avif', 'image/webp'], // Use modern formats for smaller sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Enable experimental features for faster loading
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
