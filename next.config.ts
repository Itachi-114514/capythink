import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 纯静态导出：构建产物在 out/，不需要 Node 常驻进程
  output: 'export',
  trailingSlash: true,
};

export default nextConfig;
