/** @type {import('next').NextConfig} */
const nextConfig = {
  // Убрали output: 'export' чтобы API работало
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;