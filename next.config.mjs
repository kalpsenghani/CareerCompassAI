/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Ignore test files during build
    config.module.rules.push({
      test: /test\/data\/.*\.pdf$/,
      use: 'ignore-loader'
    });
    return config;
  },
}

export default nextConfig
