// @ts-check

const { withMiddleware } = require("middleware-next");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
};

module.exports = withMiddleware(nextConfig);
