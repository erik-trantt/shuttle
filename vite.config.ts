import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tsConfigs from "./tsconfig.app.json";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: "/shuttle/",
  server: {
    host: command === "serve" ? "0.0.0.0" : undefined,
  },

  build: {
    minify: false,
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
          .map(([key, value]) => [key, resolve(__dirname, value[0])]),
      ),
      "@": resolve(__dirname, "./src"),
      "~": resolve(__dirname, "./src"),
    },
  },
}));
