import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'jeep-sqlite'
        }
      }
    })
  ],
  optimizeDeps: {
    exclude: ['jeep-sqlite', '@capacitor-community/sqlite', 'sql.js']
  }
})
