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
        // Medición actual: 52.38 / 50.06 / 54.14 / 55.12
        statements: 52,
        branches: 50,
        functions: 54,
        lines: 55
      }
    }
  }
});
