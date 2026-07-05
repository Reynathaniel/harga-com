/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'id-live-01.slatic.net' },
      { protocol: 'https', hostname: 'filebroker-cdn.lazada.co.id' },
      { protocol: 'https', hostname: 'sg-test-11.slatic.net' },
      { protocol: 'https', hostname: '*.slatic.net' },
      { protocol: 'https', hostname: 'cf.shopee.co.id' },
      { protocol: 'https', hostname: '*.shopee.co.id' },
      { protocol: 'https', hostname: '*.tokopedia.net' },
      { protocol: 'https', hostname: '*.tokopedia.com' },
      { protocol: 'https', hostname: '*.bukalapak.com' },
      { protocol: 'https', hostname: '*.alicdn.com' },
      { protocol: 'https', hostname: '*.blibli.com' },
    ],
  },
  reactStrictMode: true,
}

module.exports = nextConfig
