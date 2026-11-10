/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The one-time /setup-import page uploads a .sql file through a server action.
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
};
module.exports = nextConfig;
