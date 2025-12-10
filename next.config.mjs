/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Only ignore build errors in development
    ignoreBuildErrors: process.env.NODE_ENV === "development",
  },
  images: {
    // Enable image optimization in production
    unoptimized: process.env.NODE_ENV === "development",
    domains: ['images.unsplash.com'], // Add any external image domains
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Only use turbopack in development
  ...(process.env.NODE_ENV === "development" && { turbopack: {} }),
}

export default nextConfig
