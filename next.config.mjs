/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Đáp án (.OUT) nằm trong private-data/ (không công khai).
    // Dòng này bảo Vercel đóng gói thư mục đó vào máy chủ chấm bài.
    outputFileTracingIncludes: {
      '/api/grade': ['./private-data/**/*'],
      '/api/login': ['./private-data/ma-pin.json'],
    },
  },
};

export default nextConfig;
