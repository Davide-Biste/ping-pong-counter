import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Ensure host is 0.0.0.0 for docker/network if needed, but usually default is fine.
  // Tauri ignores server options mostly in dev but good to be standard.
  server: {
    port: 1420,
    strictPort: true,
  }
})
