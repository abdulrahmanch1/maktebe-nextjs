/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'jldyyfkashoisxxyfhmb.supabase.co',
        port: '',
        pathname: '/storage/**',
      },
    ],
  },
};

export default nextConfig;
