import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tsConfigs from "./tsconfig.app.json";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: "/shuttle/",
  server: {
    host: command === "serve" ? "0.0.0.0" : undefined,
  },

  /**
   * https://stackoverflow.com/questions/77249074/how-do-i-use-typescript-path-aliases-in-vite
   */
  resolve: {
    alias: {
      ...Object.fromEntries(
        Object.entries(tsConfigs.compilerOptions.paths)
          .filter(([_key, value]) => {
            return !value[0].endsWith("*");
          })
          .map(([key, value]) => [key, path.resolve(__dirname, value[0])]),
      ),
      "@": path.resolve(__dirname, "./src"),
      "~": path.resolve(__dirname, "./src"),
    },
  },
}));
