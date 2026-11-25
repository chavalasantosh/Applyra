import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  build: {
    outDir: path.resolve(__dirname, 'assets/v3-lab'),
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    lib: {
      entry: path.resolve(__dirname, 'src-v3/lab/main.tsx'),
      name: 'ApplyraVisualLab',
      formats: ['es'],
      fileName: () => 'lab.js'
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'lab.css';
          }
          return '[name][extname]';
        }
      }
    }
  }
});
