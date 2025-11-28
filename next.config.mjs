import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [60, 75, 85],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'jldyyfkashoisxxyfhmb.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'jldyyfkashoisxxyfhmb.supabase.co',
        pathname: '/storage/v1/object/public/book-pdfs/**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['react-icons'],
  },
  modularizeImports: {
    'react-icons': {
      transform: 'react-icons/{{member}}',
    },
  },
  async rewrites() {
    return [
      // Keep old /book/:slug/:id links working after moving to /book/:id
      {
        source: '/book/:slug/:id',
        destination: '/book/:id',
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
