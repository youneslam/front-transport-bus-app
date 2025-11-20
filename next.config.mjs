/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true, // garde ton config actuelle
  },
  images: {
    unoptimized: true, // garde ton config actuelle
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4004/api/:path*',
      },
    ]
  },
}

export default nextConfig
