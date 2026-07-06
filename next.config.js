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
      // OLX Indonesia CDN (Motor Bekas, Rumah Bekas, Mobil Bekas)
      { protocol: 'https', hostname: 'apollo.olx.co.id' },
      { protocol: 'https', hostname: '*.olx.co.id' },
      { protocol: 'https', hostname: 'images.olx.com' },
      // Carousell CDN
      { protocol: 'https', hostname: '*.carousell.com' },
      { protocol: 'https', hostname: 'media.karousell.com' },
      // AWS CloudFront (used by many vehicle marketplaces)
      { protocol: 'https', hostname: '*.cloudfront.net' },
      // Wikimedia (used in some product listings)
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'commons.wikimedia.org' },
      // Catch-all for any other HTTPS image CDN
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Suppress hydration warnings from browser extensions
  reactStrictMode: true,
}

module.exports = nextConfig
