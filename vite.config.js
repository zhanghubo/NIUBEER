import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/** @type {import('vite').UserConfig} */
export default defineConfig({
  base: '/NIUBEER/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * 手动拆包：React 核心 + 路由单独打 vendor chunk，
         * 浏览器可长期缓存，业务代码更新时不必重新下载
         */
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
});
