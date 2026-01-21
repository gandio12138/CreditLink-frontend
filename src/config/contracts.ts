// 合约地址配置 - 根据部署网络更新
export const CONTRACT_ADDRESSES = {
  // Sepolia测试网
  11155111: {
    LendingPool: '0x5f9e27ba0cf5db736a2acb8d45dd5407d925979b' as `0x${string}`,
    RiskRegistry: '0x10d18b2fbb77d831a7b941ca37c9177229f22ba8' as `0x${string}`,
    PriceOracle: '0x574feb61f783e974033e5eea7cf036bf984b6977' as `0x${string}`,
    IncentiveController: '0xfc8d415c2631a8dc610b623a5d5edbfb7305bd3c' as `0x${string}`,
    Treasury: '0x845498093c8fd401e965098f6eb7a68dbc2a7733' as `0x${string}`,
    // 测试代币
    USDT: '0x6e19a8dd6d874180363398715fd4f2682a0ec37e' as `0x${string}`,
    USDC: '0x6adce9e1bf72c6b9e9f6025c9a9e5391f024c9dc' as `0x${string}`,
    WETH: '0x216c5954ec9feefcb7f277d16d4a794ab90542f6' as `0x${string}`,
    WBTC: '0x0000000000000000000000000000000000000000' as `0x${string}`,
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
      { name: 'onBehalfOf', type: 'address' },
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
      { name: 'to', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // 普通借款
  {
    name: 'borrow',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'onBehalfOf', type: 'address' },
    ],
    outputs: [],
  },
  // 信用借款（带签名）
  {
    name: 'borrowWithCredit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'onBehalfOf', type: 'address' },
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
      { name: 'onBehalfOf', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
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
      { name: 'currentVariableBorrowRate', type: 'uint256' },
      { name: 'lastUpdateTimestamp', type: 'uint40' },
      { name: 'cTokenAddress', type: 'address' },
      { name: 'totalDeposits', type: 'uint256' },
      { name: 'totalBorrows', type: 'uint256' },
    ],
  },
  // 获取用户储备数据
  {
    name: 'getUserReserveData',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'user', type: 'address' },
    ],
    outputs: [
      { name: 'currentCTokenBalance', type: 'uint256' },
      { name: 'currentVariableDebt', type: 'uint256' },
      { name: 'scaledVariableDebt', type: 'uint256' },
      { name: 'usageAsCollateralEnabled', type: 'bool' },
    ],
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
  if (!addresses) {
    console.warn(`不支持的网络ID: ${chainId}，使用本地开发网络配置`);
    return CONTRACT_ADDRESSES[31337];
  }
  return addresses;
}
