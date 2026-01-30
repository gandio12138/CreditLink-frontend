import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { api } from '../services/api';
import { useUserStore } from '../store/useStore';
import type {
  AccountData,
  UserPositions,
  ActivityRecord,
  CreditInfo,
  PlatformStats,
  MarketStatsResponse,
  RiskParamsResponse,
} from '../types';
import {
  MOCK_PLATFORM_STATS,
  MOCK_MARKET_STATS,
  MOCK_CREDIT_INFO,
  MOCK_ACCOUNT_DATA,
  MOCK_USER_POSITIONS,
  MOCK_ACTIVITIES,
} from '../data/mockData';

// ==================== Query Keys ====================
// 统一管理所有查询的key，便于缓存失效和依赖管理

export const queryKeys = {
  // 用户相关
  user: {
    all: ['user'] as const,
    account: () => [...queryKeys.user.all, 'account'] as const,
    positions: () => [...queryKeys.user.all, 'positions'] as const,
    activities: () => [...queryKeys.user.all, 'activities'] as const,
    credit: () => [...queryKeys.user.all, 'credit'] as const,
  },
  // 平台相关
  platform: {
    all: ['platform'] as const,
    stats: () => [...queryKeys.platform.all, 'stats'] as const,
  },
  // 市场相关
  market: {
    all: ['market'] as const,
    stats: () => [...queryKeys.market.all, 'stats'] as const,
    riskParams: () => [...queryKeys.market.all, 'riskParams'] as const,
    assetRiskParams: (asset: string) => [...queryKeys.market.all, 'riskParams', asset] as const,
  },
} as const;

// ==================== 用户账户数据 ====================

export function useAccountData() {
  const { isConnected } = useAccount();
  const { isAuthenticated } = useUserStore();

  return useQuery({
    queryKey: queryKeys.user.account(),
    queryFn: async (): Promise<AccountData> => {
      const result = await api.getAccount();
      if (result.error || !result.data) {
        console.warn('获取账户数据失败，使用模拟数据:', result.error);
        return MOCK_ACCOUNT_DATA;
      }
      return result.data;
    },
    enabled: isConnected && isAuthenticated,
    staleTime: 30 * 1000, // 30秒内数据视为新鲜
    placeholderData: MOCK_ACCOUNT_DATA,
  });
}

// ==================== 用户持仓数据 ====================

export function useUserPositions() {
  const { isConnected } = useAccount();
  const { isAuthenticated } = useUserStore();

  return useQuery({
    queryKey: queryKeys.user.positions(),
    queryFn: async (): Promise<UserPositions> => {
      const result = await api.getPositions();
      if (result.error || !result.data) {
        console.warn('获取持仓数据失败，使用模拟数据:', result.error);
        return MOCK_USER_POSITIONS;
      }
      // 如果数据为空，使用模拟数据
      if (result.data.deposits.length === 0 && result.data.borrows.length === 0) {
        return MOCK_USER_POSITIONS;
      }
      return result.data;
    },
    enabled: isConnected && isAuthenticated,
    staleTime: 30 * 1000,
    placeholderData: MOCK_USER_POSITIONS,
  });
}

// ==================== 用户活动记录 ====================

export function useUserActivities() {
  const { isConnected } = useAccount();
  const { isAuthenticated } = useUserStore();

  return useQuery({
    queryKey: queryKeys.user.activities(),
    queryFn: async (): Promise<ActivityRecord[]> => {
      const result = await api.getActivities();
      if (result.error || !result.data) {
        console.warn('获取活动记录失败，使用模拟数据:', result.error);
        return MOCK_ACTIVITIES;
      }
      // 如果数据为空，使用模拟数据
      if (result.data.activities.length === 0) {
        return MOCK_ACTIVITIES;
      }
      return result.data.activities;
    },
    enabled: isConnected && isAuthenticated,
    staleTime: 60 * 1000, // 活动记录1分钟内视为新鲜
    placeholderData: MOCK_ACTIVITIES,
  });
}

// ==================== 用户信用信息 ====================

export function useCreditInfo() {
  const { isConnected } = useAccount();
  const { isAuthenticated, setCreditInfo } = useUserStore();

  return useQuery({
    queryKey: queryKeys.user.credit(),
    queryFn: async (): Promise<CreditInfo> => {
      const result = await api.getCredit();
      if (result.error || !result.data) {
        console.warn('获取信用信息失败，使用模拟数据:', result.error);
        setCreditInfo(MOCK_CREDIT_INFO);
        return MOCK_CREDIT_INFO;
      }
      // 同步到zustand store以便其他组件使用
      setCreditInfo(result.data);
      return result.data;
    },
    enabled: isConnected && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 信用信息5分钟内视为新鲜
    placeholderData: MOCK_CREDIT_INFO,
  });
}

// ==================== 刷新信用分 (Mutation) ====================

export function useRefreshCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await api.refreshCredit();
      if (result.error || !result.data) {
        throw new Error(result.error || '刷新信用分失败');
      }
      return result.data;
    },
    onSuccess: () => {
      // 刷新成功后使信用信息缓存失效
      queryClient.invalidateQueries({ queryKey: queryKeys.user.credit() });
    },
  });
}

// ==================== 平台统计数据 ====================

export function usePlatformStats() {
  return useQuery({
    queryKey: queryKeys.platform.stats(),
    queryFn: async (): Promise<PlatformStats> => {
      const result = await api.getPlatformStats();
      if (result.error || !result.data) {
        console.warn('获取平台统计失败，使用模拟数据:', result.error);
        return MOCK_PLATFORM_STATS;
      }
      return result.data;
    },
    staleTime: 60 * 1000, // 平台统计1分钟内视为新鲜
    refetchInterval: 60 * 1000, // 每分钟自动刷新
    placeholderData: MOCK_PLATFORM_STATS,
  });
}

// ==================== 市场统计数据 ====================

export function useMarketStats() {
  return useQuery({
    queryKey: queryKeys.market.stats(),
    queryFn: async (): Promise<MarketStatsResponse> => {
      const result = await api.getMarketStats();
      if (result.error || !result.data) {
        console.warn('获取市场数据失败，使用模拟数据:', result.error);
        return { markets: MOCK_MARKET_STATS };
      }
      // 如果市场数据为空，使用模拟数据
      if (result.data.markets.length === 0) {
        return { markets: MOCK_MARKET_STATS };
      }
      return result.data;
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // 每30秒自动刷新市场数据
    placeholderData: { markets: MOCK_MARKET_STATS },
  });
}

// ==================== 风险参数 ====================

export function useRiskParams() {
  return useQuery({
    queryKey: queryKeys.market.riskParams(),
    queryFn: async (): Promise<RiskParamsResponse | null> => {
      const result = await api.getRiskParams();
      if (result.error || !result.data) {
        console.warn('获取风险参数失败:', result.error);
        return null;
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 风险参数5分钟内视为新鲜
  });
}

// ==================== 特定资产风险参数 ====================

export function useAssetRiskParams(asset: string | undefined) {
  return useQuery({
    queryKey: queryKeys.market.assetRiskParams(asset || ''),
    queryFn: async () => {
      if (!asset) return null;
      const result = await api.getAssetRiskParams(asset);
      if (result.error || !result.data) {
        console.warn('获取资产风险参数失败:', result.error);
        return null;
      }
      return result.data;
    },
    enabled: !!asset,
    staleTime: 5 * 60 * 1000,
  });
}

// ==================== 缓存失效工具函数 ====================

export function useInvalidateUserData() {
  const queryClient = useQueryClient();

  return {
    // 使所有用户数据失效
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
    },
    // 使账户数据失效
    invalidateAccount: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.account() });
    },
    // 使持仓数据失效
    invalidatePositions: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.positions() });
    },
    // 使活动记录失效
    invalidateActivities: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.activities() });
    },
    // 使信用信息失效
    invalidateCredit: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.credit() });
    },
    // 交易完成后刷新相关数据
    onTransactionSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.account() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.positions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.activities() });
    },
  };
}
