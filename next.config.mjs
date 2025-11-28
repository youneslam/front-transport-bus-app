/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true, // garde ton config actuelle
  },
  images: {
    unoptimized: true, // garde ton config actuelle
  },
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/buses/:path*',
        destination: 'http://localhost:4004/api/buses/:path*',
      },
      {
        source: '/api/location/:path*',
        destination: 'http://localhost:4004/api/location/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:4004/api/:path*',
      },
    ]
  },
}

export default nextConfig
