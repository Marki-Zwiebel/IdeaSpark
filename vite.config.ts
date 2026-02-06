import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDRBlzUzEJfX_kHgZPw2jjj-bj3Z5AtyWQ'),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  server: {
    historyApiFallback: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
  }
});