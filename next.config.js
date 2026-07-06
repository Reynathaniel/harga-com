/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // serve all external CDN images directly — zero Vercel image-opt quota
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Lazada CDN domains
      { protocol: 'https', hostname: 'id-live-01.slatic.net' },
      { protocol: 'https', hostname: 'filebroker-cdn.lazada.co.id' },
      { protocol: 'https', hostname: 'sg-test-11.slatic.net' },
      { protocol: 'https', hostname: '*.slatic.net' },
      // Shopee CDN
      { protocol: 'https', hostname: 'cf.shopee.co.id' },
      { protocol: 'https', hostname: '*.shopee.co.id' },
      // Tokopedia CDN
      { protocol: 'https', hostname: '*.tokopedia.net' },
      { protocol: 'https', hostname: '*.tokopedia.com' },
      // Bukalapak CDN
      { protocol: 'https', hostname: '*.bukalapak.com' },
      // Generic image CDNs used in scraped data
      { protocol: 'https', hostname: '*.alicdn.com' },
      { protocol: 'https', hostname: '*.blibli.com' },
    ],
  },
  // Suppress hydration warnings from browser extensions
  reactStrictMode: true,
}

module.exports = nextConfig
