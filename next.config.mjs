/** @type {import('next').NextConfig} */
const nextConfig = {
  // API-only server: no pages to prerender, so Cache Components is off.
  // Every route handler runs per request on the Node.js runtime.
  poweredByHeader: false,
};

export default nextConfig;
