// next.config.ts
import type { NextConfig } from "next";
const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8080").replace(/\/+$/,"");
const nextConfig: NextConfig = {
  async rewrites() { return [{ source: "/api/chat", destination: `${BACKEND_URL}/chat` }]; },
};
export default nextConfig;
