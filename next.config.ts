import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // 开发环境允许所有来源（使用通配符）
  allowedDevOrigins: process.env.NODE_ENV === 'development'
    ? ['*']
    : [],
};

export default nextConfig;
