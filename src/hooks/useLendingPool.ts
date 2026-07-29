import { useCallback } from 'react';
import {
  useAccount,
  useChainId,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import {
  getContractAddresses,
  isConfiguredAddress,
  LENDING_POOL_ABI,
  ERC20_ABI,
} from '../config/contracts';

const UNCONFIGURED_CONTRACT_ERROR = new Error('当前网络尚未配置新版 CreditLink 合约地址');

// 获取用户账户数据
export function useUserAccountData() {
  const { address } = useAccount();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const lendingPoolAddress = isConfiguredAddress(addresses.LendingPool)
    ? addresses.LendingPool
    : undefined;

  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: lendingPoolAddress,
    abi: LENDING_POOL_ABI,
    functionName: 'getUserAccountData',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!lendingPoolAddress,
    },
  });

  return {
    data: data
      ? {
          totalCollateralUSD: formatUnits(data[0], 18),
          totalDebtUSD: formatUnits(data[1], 18),
          availableBorrowUSD: formatUnits(data[2], 18),
          currentLtv: Number(data[3]),
          healthFactor: formatUnits(data[4], 18),
        }
      : null,
    isLoading,
    isError: !!address && (!lendingPoolAddress || isError),
    error: !lendingPoolAddress && address ? UNCONFIGURED_CONTRACT_ERROR : error,
    isConfigured: !!lendingPoolAddress,
    refetch,
  };
}

// 获取储备数据
export function useReserveData(assetAddress: `0x${string}` | undefined) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const lendingPoolAddress = isConfiguredAddress(addresses.LendingPool)
    ? addresses.LendingPool
    : undefined;
  const configuredAsset = isConfiguredAddress(assetAddress) ? assetAddress : undefined;

  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: lendingPoolAddress,
    abi: LENDING_POOL_ABI,
    functionName: 'getReserveData',
    args: configuredAsset ? [configuredAsset] : undefined,
    query: {
      enabled: !!configuredAsset && !!lendingPoolAddress,
    },
  });

  return {
    data: data
      ? {
          liquidityIndex: data[0],
          variableBorrowIndex: data[1],
          currentLiquidityRate: data[2],
          currentBorrowRate: data[3],
          lastUpdateTimestamp: data[4],
          cTokenAddress: data[5],
          totalBorrows: data[6],
          totalDeposits: data[7],
        }
      : null,
    isLoading,
    isError: !!assetAddress && (!configuredAsset || !lendingPoolAddress || isError),
    error: assetAddress && (!configuredAsset || !lendingPoolAddress)
      ? UNCONFIGURED_CONTRACT_ERROR
      : error,
    refetch,
  };
}

// 获取用户在特定资产的数据
export function useUserReserveData(assetAddress: `0x${string}` | undefined) {
  const { address } = useAccount();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const lendingPoolAddress = isConfiguredAddress(addresses.LendingPool)
    ? addresses.LendingPool
    : undefined;
  const configuredAsset = isConfiguredAddress(assetAddress) ? assetAddress : undefined;

  const depositQuery = useReadContract({
    address: lendingPoolAddress,
    abi: LENDING_POOL_ABI,
    functionName: 'getUserDeposit',
    args: configuredAsset && address ? [address, configuredAsset] : undefined,
    query: {
      enabled: !!configuredAsset && !!address && !!lendingPoolAddress,
    },
  });

  const debtQuery = useReadContract({
    address: lendingPoolAddress,
    abi: LENDING_POOL_ABI,
    functionName: 'getUserDebt',
    args: configuredAsset && address ? [address, configuredAsset] : undefined,
    query: {
      enabled: !!configuredAsset && !!address && !!lendingPoolAddress,
    },
  });

  const isUnconfigured = !!assetAddress && (!configuredAsset || !lendingPoolAddress);

  return {
    data: depositQuery.data !== undefined && debtQuery.data !== undefined
      ? {
          currentCTokenBalance: depositQuery.data,
          currentVariableDebt: debtQuery.data,
        }
      : null,
    isLoading: depositQuery.isLoading || debtQuery.isLoading,
    isError: isUnconfigured || depositQuery.isError || debtQuery.isError,
    error: isUnconfigured
      ? UNCONFIGURED_CONTRACT_ERROR
      : depositQuery.error || debtQuery.error,
    refetch: async () => Promise.all([depositQuery.refetch(), debtQuery.refetch()]),
  };
}

// 获取ERC20余额
export function useTokenBalance(tokenAddress: `0x${string}` | undefined) {
  const { address } = useAccount();
  const configuredToken = isConfiguredAddress(tokenAddress) ? tokenAddress : undefined;

  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: configuredToken,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!configuredToken && !!address,
    },
  });

  return {
    balance: data,
    isLoading,
    isError: !!tokenAddress && (!configuredToken || isError),
    error: tokenAddress && !configuredToken ? UNCONFIGURED_CONTRACT_ERROR : error,
    refetch,
  };
}

// 获取ERC20授权额度
export function useTokenAllowance(
  tokenAddress: `0x${string}` | undefined,
  spenderAddress: `0x${string}` | undefined
) {
  const { address } = useAccount();
  const configuredToken = isConfiguredAddress(tokenAddress) ? tokenAddress : undefined;
  const configuredSpender = isConfiguredAddress(spenderAddress) ? spenderAddress : undefined;

  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: configuredToken,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && configuredSpender ? [address, configuredSpender] : undefined,
    query: {
      enabled: !!configuredToken && !!address && !!configuredSpender,
    },
  });

  return {
    allowance: data,
    isLoading,
    isError: !!tokenAddress && (!configuredToken || !configuredSpender || isError),
    error: tokenAddress && (!configuredToken || !configuredSpender)
      ? UNCONFIGURED_CONTRACT_ERROR
      : error,
    refetch,
  };
}

// 授权ERC20
export function useApproveToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = useCallback(
    async (tokenAddress: `0x${string}`, spenderAddress: `0x${string}`, amount: bigint) => {
      if (!isConfiguredAddress(tokenAddress) || !isConfiguredAddress(spenderAddress)) {
        throw UNCONFIGURED_CONTRACT_ERROR;
      }
      writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spenderAddress, amount],
      });
    },
    [writeContract]
  );

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// 存款操作
export function useDeposit() {
  const { address } = useAccount();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const lendingPoolAddress = isConfiguredAddress(addresses.LendingPool)
    ? addresses.LendingPool
    : undefined;

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = useCallback(
    async (assetAddress: `0x${string}`, amount: bigint) => {
      if (!address) throw new Error('请先连接钱包');
      if (!lendingPoolAddress || !isConfiguredAddress(assetAddress)) {
        throw UNCONFIGURED_CONTRACT_ERROR;
      }

      writeContract({
        address: lendingPoolAddress,
        abi: LENDING_POOL_ABI,
        functionName: 'deposit',
        args: [assetAddress, amount],
      });
    },
    [address, lendingPoolAddress, writeContract]
  );

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// 提款操作
export function useWithdraw() {
  const { address } = useAccount();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const lendingPoolAddress = isConfiguredAddress(addresses.LendingPool)
    ? addresses.LendingPool
    : undefined;

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const withdraw = useCallback(
    async (assetAddress: `0x${string}`, amount: bigint) => {
      if (!address) throw new Error('请先连接钱包');
      if (!lendingPoolAddress || !isConfiguredAddress(assetAddress)) {
        throw UNCONFIGURED_CONTRACT_ERROR;
      }

      writeContract({
        address: lendingPoolAddress,
        abi: LENDING_POOL_ABI,
        functionName: 'withdraw',
        args: [assetAddress, amount],
      });
    },
    [address, lendingPoolAddress, writeContract]
  );

  return {
    withdraw,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// 信用借款操作（带签名）
export function useBorrowWithCredit() {
  const { address } = useAccount();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const lendingPoolAddress = isConfiguredAddress(addresses.LendingPool)
    ? addresses.LendingPool
    : undefined;

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const borrowWithCredit = useCallback(
    async (
      assetAddress: `0x${string}`,
      amount: bigint,
      market: `0x${string}`,
      ltv: bigint,
      amountCap: bigint,
      nonce: bigint,
      deadline: bigint,
      signature: `0x${string}`
    ) => {
      if (!address) throw new Error('请先连接钱包');
      if (!lendingPoolAddress || !isConfiguredAddress(assetAddress)) {
        throw UNCONFIGURED_CONTRACT_ERROR;
      }

      writeContract({
        address: lendingPoolAddress,
        abi: LENDING_POOL_ABI,
        functionName: 'borrow',
        args: [assetAddress, amount, address, market, ltv, amountCap, nonce, deadline, signature],
      });
    },
    [address, lendingPoolAddress, writeContract]
  );

  return {
    borrowWithCredit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// 还款操作
export function useRepay() {
  const { address } = useAccount();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const lendingPoolAddress = isConfiguredAddress(addresses.LendingPool)
    ? addresses.LendingPool
    : undefined;

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const repay = useCallback(
    async (assetAddress: `0x${string}`, amount: bigint) => {
      if (!address) throw new Error('请先连接钱包');
      if (!lendingPoolAddress || !isConfiguredAddress(assetAddress)) {
        throw UNCONFIGURED_CONTRACT_ERROR;
      }

      writeContract({
        address: lendingPoolAddress,
        abi: LENDING_POOL_ABI,
        functionName: 'repay',
        args: [assetAddress, amount],
      });
    },
    [address, lendingPoolAddress, writeContract]
  );

  return {
    repay,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// 辅助函数: 解析金额
export function parseTokenAmount(amount: string, decimals: number): bigint {
  return parseUnits(amount, decimals);
}

// 辅助函数: 格式化金额
export function formatTokenAmount(amount: bigint, decimals: number): string {
  return formatUnits(amount, decimals);
}
