import { useCallback } from 'react';
import {
  useAccount,
  useChainId,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { getContractAddresses, LENDING_POOL_ABI, ERC20_ABI } from '../config/contracts';

// 获取用户账户数据
export function useUserAccountData() {
  const { address } = useAccount();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { data, isLoading, refetch } = useReadContract({
    address: addresses.LendingPool,
    abi: LENDING_POOL_ABI,
    functionName: 'getUserAccountData',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
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
    refetch,
  };
}

// 获取储备数据
export function useReserveData(assetAddress: `0x${string}` | undefined) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { data, isLoading, refetch } = useReadContract({
    address: addresses.LendingPool,
    abi: LENDING_POOL_ABI,
    functionName: 'getReserveData',
    args: assetAddress ? [assetAddress] : undefined,
    query: {
      enabled: !!assetAddress,
    },
  });

  return {
    data: data
      ? {
          liquidityIndex: data[0],
          variableBorrowIndex: data[1],
          currentLiquidityRate: data[2],
          currentVariableBorrowRate: data[3],
          lastUpdateTimestamp: data[4],
          cTokenAddress: data[5],
          totalDeposits: data[6],
          totalBorrows: data[7],
        }
      : null,
    isLoading,
    refetch,
  };
}

// 获取用户在特定资产的数据
export function useUserReserveData(assetAddress: `0x${string}` | undefined) {
  const { address } = useAccount();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { data, isLoading, refetch } = useReadContract({
    address: addresses.LendingPool,
    abi: LENDING_POOL_ABI,
    functionName: 'getUserReserveData',
    args: assetAddress && address ? [assetAddress, address] : undefined,
    query: {
      enabled: !!assetAddress && !!address,
    },
  });

  return {
    data: data
      ? {
          currentCTokenBalance: data[0],
          currentVariableDebt: data[1],
          scaledVariableDebt: data[2],
          usageAsCollateralEnabled: data[3],
        }
      : null,
    isLoading,
    refetch,
  };
}

// 获取ERC20余额
export function useTokenBalance(tokenAddress: `0x${string}` | undefined) {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!tokenAddress && !!address,
    },
  });

  return {
    balance: data,
    isLoading,
    refetch,
  };
}

// 获取ERC20授权额度
export function useTokenAllowance(
  tokenAddress: `0x${string}` | undefined,
  spenderAddress: `0x${string}` | undefined
) {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && spenderAddress ? [address, spenderAddress] : undefined,
    query: {
      enabled: !!tokenAddress && !!address && !!spenderAddress,
    },
  });

  return {
    allowance: data,
    isLoading,
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

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = useCallback(
    async (assetAddress: `0x${string}`, amount: bigint) => {
      if (!address) throw new Error('请先连接钱包');

      writeContract({
        address: addresses.LendingPool,
        abi: LENDING_POOL_ABI,
        functionName: 'deposit',
        args: [assetAddress, amount, address],
      });
    },
    [address, addresses.LendingPool, writeContract]
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

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const withdraw = useCallback(
    async (assetAddress: `0x${string}`, amount: bigint) => {
      if (!address) throw new Error('请先连接钱包');

      writeContract({
        address: addresses.LendingPool,
        abi: LENDING_POOL_ABI,
        functionName: 'withdraw',
        args: [assetAddress, amount, address],
      });
    },
    [address, addresses.LendingPool, writeContract]
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

// 普通借款操作
export function useBorrow() {
  const { address } = useAccount();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const borrow = useCallback(
    async (assetAddress: `0x${string}`, amount: bigint) => {
      if (!address) throw new Error('请先连接钱包');

      writeContract({
        address: addresses.LendingPool,
        abi: LENDING_POOL_ABI,
        functionName: 'borrow',
        args: [assetAddress, amount, address],
      });
    },
    [address, addresses.LendingPool, writeContract]
  );

  return {
    borrow,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// 信用借款操作（带签名）
export function useBorrowWithCredit() {
  const { address } = useAccount();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const borrowWithCredit = useCallback(
    async (
      assetAddress: `0x${string}`,
      amount: bigint,
      ltv: bigint,
      amountCap: bigint,
      nonce: bigint,
      deadline: bigint,
      signature: `0x${string}`
    ) => {
      if (!address) throw new Error('请先连接钱包');

      writeContract({
        address: addresses.LendingPool,
        abi: LENDING_POOL_ABI,
        functionName: 'borrowWithCredit',
        args: [assetAddress, amount, address, ltv, amountCap, nonce, deadline, signature],
      });
    },
    [address, addresses.LendingPool, writeContract]
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

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const repay = useCallback(
    async (assetAddress: `0x${string}`, amount: bigint) => {
      if (!address) throw new Error('请先连接钱包');

      writeContract({
        address: addresses.LendingPool,
        abi: LENDING_POOL_ABI,
        functionName: 'repay',
        args: [assetAddress, amount, address],
      });
    },
    [address, addresses.LendingPool, writeContract]
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
