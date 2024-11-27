/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

/** @type {import("next").NextConfig} */
const config = {
  // Uncomment for Tree Shaking (Remove what you don't use) 
  // https://mantine.dev/guides/next/#app-router-tree-shaking

  // experimental: {
  //   optimizePackageImports: ["@mantine/core", "@mantine/hooks"]
  // }
};

export default config;
