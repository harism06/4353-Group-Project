import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // this tells Vite: "@" means the web/src folder
    alias: { "@": "/src" },
  },
});
