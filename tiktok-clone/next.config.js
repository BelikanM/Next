/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['cloud.appwrite.io'],
  },
  experimental: {
    appDir: false,
  },
}

module.exports = nextConfig
