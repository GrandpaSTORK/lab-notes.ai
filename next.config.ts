import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/gaia/policy-evidence": [
      "./content/demo/policy-evidence/content/**/*",
      "./content/demo/policy-evidence/.local/**/*",
    ],
  },
  outputFileTracingExcludes: {
    "/gaia/policy-evidence": ["./.local/**/*"],
  },
};

export default nextConfig;
