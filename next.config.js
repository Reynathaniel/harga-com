/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // serve all external CDN images directly — zero Vercel image-opt quota
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Suppress hydration warnings from browser extensions
  reactStrictMode: true,
}

module.exports = nextConfig
