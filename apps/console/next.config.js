/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@apihub/shared'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
}

module.exports = nextConfig
