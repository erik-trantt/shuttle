import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: "/shuttle/",
  server: {
    host: command === "serve" ? "0.0.0.0" : undefined,
  },
}));
