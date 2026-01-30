import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from './config/wagmi';
import App from './App';
import './index.css';

// 配置 React Query - 智能缓存和后台更新
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 数据在 30 秒内视为新鲜，不会重新请求
      staleTime: 30 * 1000,
      // 缓存数据保留 5 分钟
      gcTime: 5 * 60 * 1000,
      // 窗口聚焦时重新获取数据
      refetchOnWindowFocus: true,
      // 网络重连时重新获取数据
      refetchOnReconnect: true,
      // 失败后重试 1 次
      retry: 1,
      // 重试延迟
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    mutations: {
      // 失败后重试 1 次
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
