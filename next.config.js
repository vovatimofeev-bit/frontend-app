/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Игнорируем TypeScript ошибки во время сборки
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Игнорируем ESLint ошибки
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig