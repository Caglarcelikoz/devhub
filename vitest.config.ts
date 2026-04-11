import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['src/**/*.test.tsx', 'node_modules', '.next'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/actions/**'],
      exclude: ['src/generated/**'],
    },
  },
})
