import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    exclude: ['dist/**', 'node_modules/**'],
  },
  resolve: {
    alias: {
      '#app': path.resolve(__dirname, './app'),
      '#tests': path.resolve(__dirname, './tests'),
    },
  },
})
