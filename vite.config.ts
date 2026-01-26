import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    // 性能优化：代码分割配置
    rollupOptions: {
      output: {
        manualChunks: {
          // React 核心库
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Web3 相关库
          'web3-vendor': ['wagmi', 'viem', '@wagmi/core', '@wagmi/connectors'],
          // UI 状态管理
          'state-vendor': ['zustand', '@tanstack/react-query'],
        },
      },
    },
    // 提高警告阈值
    chunkSizeWarningLimit: 600,
    // 启用源码压缩
    minify: 'esbuild',
    // CSS 代码分割
    cssCodeSplit: true,
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'wagmi', 'zustand'],
  },
});
