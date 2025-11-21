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
      // API Géolocalisation Bus → Port 8080
      {
        source: '/api/buses/:path*',
        destination: 'http://localhost:8080/api/buses/:path*',
      },
      {
        source: '/api/location/:path*',
        destination: 'http://localhost:8080/api/location/:path*',
      },
      // Toutes les autres APIs → Port 4004
      {
        source: '/api/:path*',
        destination: 'http://localhost:4004/api/:path*',
      },
    ]
  },
}

export default nextConfig
