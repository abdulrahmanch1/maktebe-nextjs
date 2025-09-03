import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['react-pdf'], // Add this line
  images: {
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
};

export default withBundleAnalyzer(nextConfig);