import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets OpenNext ship postgres' "workerd" build (cloudflare:sockets) instead of the Node net/tls build.
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
