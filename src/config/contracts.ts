import { isAddress, zeroAddress } from 'viem';

type Address = `0x${string}`;

export interface ContractAddresses {
  LendingPool: Address;
  RiskRegistry: Address;
  PriceOracle: Address;
  IncentiveController: Address;
  Treasury: Address;
  USDT: Address;
  USDC: Address;
  WETH: Address;
  WBTC: Address;
}

function optionalEnvAddress(value: string | undefined): Address {
  return value && isAddress(value) && value.toLowerCase() !== zeroAddress
    ? value
    : zeroAddress;
}

const UNCONFIGURED_ADDRESSES: ContractAddresses = {
  LendingPool: zeroAddress,
  RiskRegistry: zeroAddress,
  PriceOracle: zeroAddress,
  IncentiveController: zeroAddress,
  Treasury: zeroAddress,
  USDT: zeroAddress,
  USDC: zeroAddress,
  WETH: zeroAddress,
  WBTC: zeroAddress,
};

// Sepolia 地址必须来自当前部署的环境变量，避免误用旧的 mock oracle 部署。
export const CONTRACT_ADDRESSES = {
  // Sepolia测试网
  11155111: {
    LendingPool: optionalEnvAddress(import.meta.env.VITE_SEPOLIA_LENDING_POOL_ADDRESS),
    RiskRegistry: optionalEnvAddress(import.meta.env.VITE_SEPOLIA_RISK_REGISTRY_ADDRESS),
    PriceOracle: optionalEnvAddress(import.meta.env.VITE_SEPOLIA_PRICE_ORACLE_ADDRESS),
    IncentiveController: optionalEnvAddress(import.meta.env.VITE_SEPOLIA_INCENTIVE_CONTROLLER_ADDRESS),
    Treasury: optionalEnvAddress(import.meta.env.VITE_SEPOLIA_TREASURY_ADDRESS),
    USDT: optionalEnvAddress(import.meta.env.VITE_SEPOLIA_USDT_ADDRESS),
    USDC: optionalEnvAddress(import.meta.env.VITE_SEPOLIA_USDC_ADDRESS),
    WETH: optionalEnvAddress(import.meta.env.VITE_SEPOLIA_WETH_ADDRESS),
    WBTC: optionalEnvAddress(import.meta.env.VITE_SEPOLIA_WBTC_ADDRESS),
  },
  // Base Sepolia测试网
  84532: {
    LendingPool: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    RiskRegistry: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    PriceOracle: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    IncentiveController: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    Treasury: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    USDT: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    USDC: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    WETH: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    WBTC: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
  // 本地开发网络
  31337: {
    LendingPool: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}`,
    RiskRegistry: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as `0x${string}`,
    PriceOracle: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' as `0x${string}`,
    IncentiveController: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9' as `0x${string}`,
    Treasury: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9' as `0x${string}`,
    USDT: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707' as `0x${string}`,
    USDC: '0x0165878A594ca255338adfa4d48449f69242Eb8F' as `0x${string}`,
    WETH: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853' as `0x${string}`,
    WBTC: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6' as `0x${string}`,
  },
} as const;

// LendingPool合约ABI (简化版，包含主要功能)
export const LENDING_POOL_ABI = [
  // 存款
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  // 提款
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  // 带信用签名的借款
  {
    name: 'borrow',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'user', type: 'address' },
      { name: 'market', type: 'bytes32' },
      { name: 'ltv', type: 'uint256' },
      { name: 'amountCap', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
  },
  // 还款
  {
    name: 'repay',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  // 获取用户账户数据
  {
    name: 'getUserAccountData',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'totalCollateralUSD', type: 'uint256' },
      { name: 'totalDebtUSD', type: 'uint256' },
      { name: 'availableBorrowUSD', type: 'uint256' },
      { name: 'currentLtv', type: 'uint256' },
      { name: 'healthFactor', type: 'uint256' },
    ],
  },
  // 获取储备数据
  {
    name: 'getReserveData',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'asset', type: 'address' }],
    outputs: [
      { name: 'liquidityIndex', type: 'uint256' },
      { name: 'variableBorrowIndex', type: 'uint256' },
      { name: 'currentLiquidityRate', type: 'uint256' },
      { name: 'currentBorrowRate', type: 'uint256' },
      { name: 'lastUpdateTimestamp', type: 'uint40' },
      { name: 'cTokenAddress', type: 'address' },
      { name: 'totalBorrows', type: 'uint256' },
      { name: 'totalDeposits', type: 'uint256' },
    ],
  },
  // 获取用户存款
  {
    name: 'getUserDeposit',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'asset', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // 获取用户债务
  {
    name: 'getUserDebt',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'asset', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // 事件
  {
    name: 'Deposit',
    type: 'event',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'asset', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'Withdraw',
    type: 'event',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'asset', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'Borrow',
    type: 'event',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'asset', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'ltv', type: 'uint256', indexed: false },
      { name: 'nonce', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'Repay',
    type: 'event',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'asset', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const;

// ERC20 ABI
export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'Approval',
    type: 'event',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
] as const;

// 获取当前网络的合约地址
export function getContractAddresses(chainId: number) {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  return addresses ?? UNCONFIGURED_ADDRESSES;
}

export function isConfiguredAddress(address: string | undefined): address is Address {
  return !!address && isAddress(address) && address.toLowerCase() !== zeroAddress;
}

const ASSET_ADDRESS_KEYS = {
  USDT: 'USDT',
  USDC: 'USDC',
  WETH: 'WETH',
  ETH: 'WETH',
  WBTC: 'WBTC',
} as const;

export function getAssetAddress(chainId: number, symbol: string): Address | undefined {
  const key = ASSET_ADDRESS_KEYS[symbol.toUpperCase() as keyof typeof ASSET_ADDRESS_KEYS];
  if (!key) return undefined;

  const address = getContractAddresses(chainId)[key];
  return isConfiguredAddress(address) ? address : undefined;
}
