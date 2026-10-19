import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const parsedSupabaseUrl = supabaseUrl ? new URL(supabaseUrl) : null;
const avatarPattern = parsedSupabaseUrl
  ? {
      protocol: parsedSupabaseUrl.protocol.slice(0, -1) as "http" | "https",
      hostname: parsedSupabaseUrl.hostname,
      port: parsedSupabaseUrl.port,
      pathname: "/storage/v1/object/sign/avatars/**",
    }
  : null;

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: avatarPattern ? { remotePatterns: [avatarPattern] } : undefined,
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
