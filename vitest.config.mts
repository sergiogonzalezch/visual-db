import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src'),
      '@shared': resolve('src/shared')
    }
  },
  test: {
    include: [
      'src/renderer/src/domain/**/*.test.ts',
      'src/renderer/src/importadores/**/*.test.ts',
      'src/main/importadores/**/*.test.ts',
      'src/main/ia/**/*.test.ts'
    ],
    environment: 'node'
  }
})
