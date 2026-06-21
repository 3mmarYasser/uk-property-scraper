/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Listing photos come straight from the portal CDN; allow them in <img>.
  images: { unoptimized: true },
};

export default nextConfig;
