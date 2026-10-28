import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative asset paths, so the build works at a domain root or a sub-path (GitHub Pages).
  base: './',
  plugins: [react(), tailwindcss()],
})
