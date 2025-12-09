import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      // só precisamos gerar o content script
      input: {
        content: resolve(__dirname, 'src/contentScript.jsx')
      },
      output: {
        // gera UM arquivo JS clássico, sem "import"
        format: 'iife',
        entryFileNames: 'contentScript.js'
      }
    }
  }
})
