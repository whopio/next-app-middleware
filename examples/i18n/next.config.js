const { withMiddleware } = require("next-app-middleware");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
};

module.exports = withMiddleware(nextConfig);
