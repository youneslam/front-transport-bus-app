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
        source: '/api/:path*',           // toutes les requêtes commençant par /api
        destination: 'http://localhost:4004/api/:path*', // redirection vers ton backend
      },
    ];
  },
};

export default nextConfig;
