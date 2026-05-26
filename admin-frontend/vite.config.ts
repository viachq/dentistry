import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3181,
    proxy: {
      "/api": "http://localhost:8870",
      "/uploads": "http://localhost:8870",
    },
  },
});
