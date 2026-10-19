import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const parsedSupabaseUrl = supabaseUrl ? new URL(supabaseUrl) : null;
const storagePatterns = parsedSupabaseUrl
  ? ["avatars", "service-images"].map((bucket) => ({
      protocol: parsedSupabaseUrl.protocol.slice(0, -1) as "http" | "https",
      hostname: parsedSupabaseUrl.hostname,
      port: parsedSupabaseUrl.port,
      pathname: `/storage/v1/object/sign/${bucket}/**`,
    }))
  : [];

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: storagePatterns.length
    ? { remotePatterns: storagePatterns }
    : undefined,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
