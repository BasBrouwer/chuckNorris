import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    // Must come before the React plugin.
    tanstackRouter({
      target: "react",
      // No autoCodeSplitting: all route code is a few kB, while a lazy route chunk costs a
      // network round trip on the first navigation to it, with the old page frozen meanwhile.
      routesDirectory: "./src/app/routes",
      generatedRouteTree: "./src/app/routeTree.gen.ts",
    }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
});
