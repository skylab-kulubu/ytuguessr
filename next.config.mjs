/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server for the Docker image (Dockerfile); `next dev` is unaffected.
  output: 'standalone',
};

export default nextConfig;
