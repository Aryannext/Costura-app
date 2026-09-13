import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      'tests/e2e/**'
    ],
    coverage: {
      provider: 'v8',
      all: true,
      include: [
        'src/database/**',
        'src/composables/**',
        'src/services/**'
      ],
      exclude: [
        'src/views/**',
        'src/components/**',
        'src/router/**',
        'src/main.js',
        'src/App.vue'
      ],
      reporter: ['text', 'json', 'html'],
      thresholds: {
        // Trinquete: se fijan justo por debajo de la cobertura real para que la
        // CI falle si alguien la hace bajar. Al añadir pruebas, súbelos.
        // Medición actual: 49.01 / 47.98 / 47.81 / 51.63
        statements: 49,
        branches: 47,
        functions: 47,
        lines: 51
      }
    }
  }
});
