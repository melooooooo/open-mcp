// 执行build.sh时，会设置BUILD_ENV=production， vercel环境中无此环境变量
const isProd = process.env.BUILD_ENV === "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  assetPrefix: isProd ? "https://zenly.oss-cn-hangzhou.aliyuncs.com/mcp" : "",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yilabao-img.oss-cn-beijing.aliyuncs.com",
      },
      {
        protocol: "https",
        hostname: "zenly.oss-cn-hangzhou.aliyuncs.com",
      },
      {
        protocol: "https",
        hostname: "wework.qpic.cn",
      },
      {
        protocol: "https",
        hostname: "rescdn.qqmail.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  transpilePackages: [
    "@repo/ui",
    "@repo/db",
    "@repo/email",
    "@repo/github",
    "@repo/trpc",
    "@daveyplate/better-auth-ui",
    "@daveyplate/better-auth-tanstack",
  ],
};

export default nextConfig;
