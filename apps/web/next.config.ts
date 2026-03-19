import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@base-mern/types", "@base-mern/utils"],
  output: "standalone",
};

export default nextConfig;
