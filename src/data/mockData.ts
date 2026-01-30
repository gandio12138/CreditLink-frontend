/**
 * Mock Data - 用于API返回空数据或加载时的展示数据
 */

import type {
  PlatformStats,
  MarketStatsItem,
  CreditInfo,
  AccountData,
  UserPositions,
  ActivityRecord,
} from '../types';

// 平台统计 Mock 数据
export const MOCK_PLATFORM_STATS: PlatformStats = {
  totalValueLocked: '12500000',
  totalDeposits: '10000000',
  totalBorrows: '5000000',
  activeUsers: 1256,
};

// 市场数据 Mock 数据
export const MOCK_MARKET_STATS: MarketStatsItem[] = [
  {
    symbol: 'USDT',
    name: 'Tether USD',
    totalSupply: '5000000',
    totalBorrow: '2500000',
    supplyAPY: '3.5',
    borrowAPR: '5.2',
    ltv: 8000,
    liquidationLtv: 8500,
    utilizationRate: '50',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    totalSupply: '3000000',
    totalBorrow: '1200000',
    supplyAPY: '3.2',
    borrowAPR: '4.8',
    ltv: 8000,
    liquidationLtv: 8500,
    utilizationRate: '40',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    totalSupply: '1500000',
    totalBorrow: '800000',
    supplyAPY: '2.8',
    borrowAPR: '4.5',
    ltv: 7500,
    liquidationLtv: 8000,
    utilizationRate: '53',
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    totalSupply: '500000',
    totalBorrow: '200000',
    supplyAPY: '1.5',
    borrowAPR: '3.2',
    ltv: 7000,
    liquidationLtv: 7500,
    utilizationRate: '40',
  },
];

// 信用信息 Mock 数据
export const MOCK_CREDIT_INFO: CreditInfo = {
  score: 650,
  tier: 'B',
  maxLtv: 8000,
  maxBorrow: '50000000000000000000000',
  factors: [
    { key: 'repayment_bonus', value: 50, contribution: 50 },
    { key: 'borrow_history_bonus', value: 30, contribution: 30 },
    { key: 'loyalty_bonus', value: 20, contribution: 20 },
    { key: 'wallet_age_bonus', value: 10, contribution: 10 },
    { key: 'activity_bonus', value: 15, contribution: 15 },
    { key: 'diversity_bonus', value: 10, contribution: 10 },
    { key: 'net_worth_bonus', value: 15, contribution: 15 },
  ],
  history: [
    { timestamp: Date.now() / 1000 - 86400 * 7, score: 620, event: 'INITIAL_SCORE' },
    { timestamp: Date.now() / 1000 - 86400 * 5, score: 635, event: 'SCORE_INCREASE' },
    { timestamp: Date.now() / 1000 - 86400 * 2, score: 650, event: 'SCORE_INCREASE' },
  ],
};

// 账户数据 Mock 数据
export const MOCK_ACCOUNT_DATA: AccountData = {
  totalCollateralUSD: '10000.00',
  totalDebtUSD: '3500.00',
  availableBorrowUSD: '4500.00',
  currentLtv: 3500,
  healthFactor: '2.28',
};

// 用户持仓 Mock 数据
export const MOCK_USER_POSITIONS: UserPositions = {
  deposits: [
    { asset: '0x...usdt', symbol: 'USDT', amount: '5000000000', valueUsd: '5000.00' },
    { asset: '0x...eth', symbol: 'ETH', amount: '2000000000000000000', valueUsd: '5000.00' },
  ],
  borrows: [
    { asset: '0x...usdc', symbol: 'USDC', amount: '3500000000', valueUsd: '3500.00' },
  ],
};

// 活动记录 Mock 数据
export const MOCK_ACTIVITIES: ActivityRecord[] = [
  {
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    actionType: 'DEPOSIT',
    asset: 'USDT',
    amount: '5000000000',
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 3,
  },
  {
    txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    actionType: 'DEPOSIT',
    asset: 'ETH',
    amount: '2000000000000000000',
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 2,
  },
  {
    txHash: '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
    actionType: 'BORROW',
    asset: 'USDC',
    amount: '3500000000',
    timestamp: Math.floor(Date.now() / 1000) - 86400,
  },
];

// 信用维度映射 - 将 API 返回的 factor key 映射到展示维度
export const CREDIT_FACTOR_MAPPING: Record<string, { dimension: string; label: string; icon: string }> = {
  repayment_bonus: { dimension: 'repayment', label: '还款能力', icon: '💰' },
  liquidation_penalty: { dimension: 'repayment', label: '还款能力', icon: '💰' },
  borrow_history_bonus: { dimension: 'history', label: '历史记录', icon: '📈' },
  loyalty_bonus: { dimension: 'onchain', label: '链上行为', icon: '⛓️' },
  health_factor_bonus: { dimension: 'repayment', label: '还款能力', icon: '💰' },
  wallet_age_bonus: { dimension: 'history', label: '历史记录', icon: '📈' },
  activity_bonus: { dimension: 'onchain', label: '链上行为', icon: '⛓️' },
  diversity_bonus: { dimension: 'assets', label: '资产规模', icon: '📊' },
  net_worth_bonus: { dimension: 'assets', label: '资产规模', icon: '📊' },
};

// 信用维度配置
export const CREDIT_DIMENSIONS = [
  { key: 'repayment', label: '还款能力', icon: '💰', maxScore: 100 },
  { key: 'assets', label: '资产规模', icon: '📊', maxScore: 100 },
  { key: 'onchain', label: '链上行为', icon: '⛓️', maxScore: 100 },
  { key: 'history', label: '历史记录', icon: '📈', maxScore: 100 },
];

// 将 API 返回的 factors 转换为维度分数
export function calculateDimensionScores(factors: CreditInfo['factors']): Record<string, number> {
  const scores: Record<string, number> = {
    repayment: 50, // 基础分
    assets: 50,
    onchain: 50,
    history: 50,
  };

  factors.forEach((factor) => {
    const mapping = CREDIT_FACTOR_MAPPING[factor.key];
    if (mapping) {
      scores[mapping.dimension] = Math.min(100, scores[mapping.dimension] + factor.contribution / 2);
    }
  });

  return scores;
}
