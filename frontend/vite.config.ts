import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port:8080,
    allowedHosts: [
	  'ray-solid-tapir.ngrok-free.app',
    'cool-cougar-generally.ngrok-free.app',
    ],
    watch: {
      usePolling: true,
    },
  },
})
