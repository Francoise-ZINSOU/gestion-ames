import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Config build uniquement — la config des tests vit dans vitest.config.js
export default defineConfig({
  plugins: [react()],
})
