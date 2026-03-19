import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // Simula um navegador para testar suas telas
    globals: true,        // Permite usar 'describe' e 'it' sem importar toda hora
  },
})