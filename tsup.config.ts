import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['bin.ts', 'index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node18',
  shims: true,
  banner: {
    js: `import 'dotenv/config';`,
  },
});
