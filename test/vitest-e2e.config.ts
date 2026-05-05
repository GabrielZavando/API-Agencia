import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup-e2e.ts'],
    alias: {
      '@src': './src',
      '@test': './test',
    },
    root: './',
  },
  plugins: [
    // This is required to build the test files with SWC
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
