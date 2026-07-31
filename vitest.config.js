import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// ⚠️ Ce fichier a priorité TOTALE sur vite.config.js pour Vitest :
// ne pas mettre de bloc `test` dans vite.config.js (il serait ignoré),
// et garder vite.config.js pour le build uniquement.

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',   // requis par @testing-library/react
    globals: true,          // describe/it/expect sans import
    passWithNoTests: true,  // le CI ne casse pas tant qu'aucun *.test.jsx n'existe
    // Coupe uniquement le bruit Supabase/GoTrue, laisse passer vos logs de debug
    onConsoleLog(log) {
      if (/supabase|gotrue|realtime/i.test(log)) return false
    },
  },
})
