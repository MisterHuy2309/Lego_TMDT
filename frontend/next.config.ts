import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Cho phép truy cập Dev Server từ IP LAN & Localhost */
  allowedDevOrigins: ['192.168.1.50', 'localhost:3001', '127.0.0.1:3001'],

  /* 🟢 Thêm domain www.mykingdom.com.vn vào cấu hình hình ảnh */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.mykingdom.com.vn',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
  },
};

export default nextConfig;