/** @type {import('next').NextConfig} */
const nextConfig = {
  // TODO: add your image domains here if using external image URLs
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      // {
      //   protocol: 'https',
      //   hostname: 'your-cdn.yourdomain.com',
      // },
    ],
  },

  // Enable React strict mode for better development experience
  reactStrictMode: true,
}

export default nextConfig
