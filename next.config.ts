import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // 开发环境允许常见的开发域名
  allowedDevOrigins: [
    'xiangyu-server',
    '*.local',
    '*.localhost',
    // 添加你的自定义域名到这里
  ],
};

export default nextConfig;
