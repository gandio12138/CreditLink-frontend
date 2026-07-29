// ==================== 用户相关类型 ====================

// 用户账户数据
export interface AccountData {
  totalCollateralUSD: string;
  totalDebtUSD: string;
  availableBorrowUSD: string;
  currentLtv: number;
  healthFactor: string;
}

// 用户持仓项
export interface PositionItem {
  asset: string;
  symbol: string;
  amount: string;
  valueUsd: string;
}

// 用户持仓
export interface UserPositions {
  deposits: PositionItem[];
  borrows: PositionItem[];
}

// 用户活动记录
export interface ActivityRecord {
  txHash: string;
  actionType: 'DEPOSIT' | 'WITHDRAW' | 'BORROW' | 'REPAY' | 'LIQUIDATION';
  asset: string;
  amount: string;
  timestamp: number;
}

// ==================== 信用相关类型 ====================

// 信用分因子
export interface CreditFactor {
  key: string;
  value: number;
  contribution: number;
}

// 信用分历史
export interface CreditHistoryItem {
  timestamp: number;
  score: number;
  event: string;
}

// 信用信息响应
export interface CreditInfo {
  score: number;
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  maxLtv: number;
  maxBorrow: string;
  factors: CreditFactor[];
  history: CreditHistoryItem[];
}

// 签名请求
export interface SignRequest {
  market: string;
  amount: string;
}

// 签名响应
export interface SignResponse {
  signature: string;
  market: string;
  ltv: number;
  amountCap: string;
  nonce: string;
  deadline: number;
  creditScore: number;
  creditTier: string;
}

// ==================== 市场相关类型 ====================

// 风险参数
export interface RiskParams {
  address: string;
  symbol: string;
  decimals: number;
  baseLtv: number;
  liquidationThreshold: number;
  liquidationBonus: number;
  closeFactor: number;
  borrowCap: string;
  supplyCap: string;
  borrowEnabled: boolean;
  collateralEnabled: boolean;
}

// 风险参数列表响应
export interface RiskParamsResponse {
  assets: RiskParams[];
}

// 利率策略参数
export interface InterestRateParams {
  baseRate: number;
  slope1: number;
  slope2: number;
  optimalUsage: number;
}

// 市场数据
export interface MarketData {
  asset: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  totalBorrow: string;
  supplyApy: number;
  borrowApr: number;
  utilizationRate: number;
  riskParams: RiskParams;
  price: string;
  cTokenAddress: string;
}

// ==================== 合约交互类型 ====================

// 存款参数
export interface DepositParams {
  asset: string;
  amount: bigint;
}

// 提款参数
export interface WithdrawParams {
  asset: string;
  amount: bigint;
}

// 借款参数
export interface BorrowParams {
  asset: string;
  amount: bigint;
  signature: string;
  ltv: number;
  amountCap: bigint;
  nonce: bigint;
  deadline: number;
}

// 还款参数
export interface RepayParams {
  asset: string;
  amount: bigint;
}

// ==================== API响应类型 ====================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// 认证相关
export interface NonceResponse {
  nonce: string;
  message: string;
}

export interface LoginRequest {
  wallet: string;
  signature: string;
  nonce: string;
}

export interface LoginResponse {
  token: string;
}

// ==================== 信用等级配置 ====================

export const TIER_CONFIG = {
  S: { minScore: 900, maxLtv: 9500, label: '卓越', color: 'purple' },
  A: { minScore: 800, maxLtv: 9000, label: '优秀', color: 'green' },
  B: { minScore: 600, maxLtv: 8000, label: '良好', color: 'blue' },
  C: { minScore: 400, maxLtv: 7000, label: '一般', color: 'yellow' },
  D: { minScore: 0, maxLtv: 0, label: '受限', color: 'red' },
} as const;

// ==================== 平台统计类型 ====================

// 平台统计数据
export interface PlatformStats {
  totalValueLocked: string;
  totalDeposits: string;
  totalBorrows: string;
  activeUsers: number;
}

// 市场数据（来自 /stats/markets API）
export interface MarketStatsItem {
  symbol: string;
  name: string;
  totalSupply: string; // USD value from the oracle-backed backend
  totalBorrow: string; // USD value from the oracle-backed backend
  totalSupplyAmount: string;
  totalBorrowAmount: string;
  supplyAPY: string;
  borrowAPR: string;
  ltv: number;
  liquidationLtv: number;
  utilizationRate: string;
}

// 市场数据响应
export interface MarketStatsResponse {
  markets: MarketStatsItem[];
}

// ==================== 支持的资产 ====================

export const SUPPORTED_ASSETS = [
  { symbol: 'USDT', name: 'Tether USD', decimals: 6, icon: '💵' },
  { symbol: 'USDC', name: 'USD Coin', decimals: 6, icon: '💲' },
  { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, icon: '⟠' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, icon: '₿' },
] as const;

export type SupportedAsset = typeof SUPPORTED_ASSETS[number]['symbol'];
