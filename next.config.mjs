/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server for the Docker image (Dockerfile); `next dev` is unaffected.
  output: 'standalone',
  // The image build passes the commit (GIT_SHA) so the live site shows which commit it runs:
  // /_next/static/<commit>/_buildManifest.js answers 200 only on that build. Elsewhere Next picks its own id.
  generateBuildId: async () => process.env.GIT_SHA || null,
};

export default nextConfig;
