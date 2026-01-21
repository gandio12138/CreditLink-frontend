import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { getContractAddresses } from '../../config/contracts';
import { useTokenBalance, useTokenAllowance, useApproveToken, useRepay, useUserReserveData } from '../../hooks/useLendingPool';
import { SUPPORTED_ASSETS } from '../../types';

interface RepayModalProps {
  asset: string;
  onClose: () => void;
}

export default function RepayModal({ asset, onClose }: RepayModalProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const assetInfo = SUPPORTED_ASSETS.find((a) => a.symbol === asset);
  const assetAddress = addresses[asset as keyof typeof addresses] as `0x${string}`;

  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'approve' | 'repaying' | 'success'>('input');

  // 获取钱包余额和借款余额
  const { balance, isLoading: balanceLoading, refetch: refetchBalance } = useTokenBalance(assetAddress);
  const { data: userReserveData, refetch: refetchDebt } = useUserReserveData(assetAddress);
  const { allowance, refetch: refetchAllowance } = useTokenAllowance(assetAddress, addresses.LendingPool);

  // 授权和还款hooks
  const {
    approve,
    isPending: approving,
    isConfirming: approveConfirming,
    isSuccess: approveSuccess,
    error: approveError,
  } = useApproveToken();

  const {
    repay,
    isPending: repaying,
    isConfirming: repayConfirming,
    isSuccess: repaySuccess,
    hash: repayHash,
    error: repayError,
  } = useRepay();

  // 监听授权成功
  useEffect(() => {
    if (approveSuccess) {
      refetchAllowance();
      setStep('repaying');
      handleRepayAfterApprove();
    }
  }, [approveSuccess]);

  // 监听还款成功
  useEffect(() => {
    if (repaySuccess) {
      setStep('success');
      refetchBalance();
      refetchDebt();
    }
  }, [repaySuccess, refetchBalance, refetchDebt]);

  // 格式化余额
  const formattedBalance = balance
    ? formatUnits(balance, assetInfo?.decimals || 18)
    : '0';

  // 借款余额
  const debtBalance = userReserveData
    ? formatUnits(userReserveData.currentVariableDebt, assetInfo?.decimals || 18)
    : '0';

  // 解析输入金额
  const parsedAmount = amount
    ? parseUnits(amount, assetInfo?.decimals || 18)
    : BigInt(0);

  // 检查是否需要授权
  const needsApproval = allowance !== undefined && parsedAmount > BigInt(0) && allowance < parsedAmount;

  // 处理最大金额（取钱包余额和借款余额的较小值）
  const handleMax = () => {
    const maxRepay = Math.min(parseFloat(formattedBalance), parseFloat(debtBalance));
    setAmount(maxRepay.toString());
  };

  // 授权后执行还款
  const handleRepayAfterApprove = async () => {
    if (!assetAddress || parsedAmount <= BigInt(0)) return;
    try {
      await repay(assetAddress, parsedAmount);
    } catch (error) {
      console.error('还款失败:', error);
      setStep('input');
    }
  };

  // 处理授权
  const handleApprove = async () => {
    if (!assetAddress || !addresses.LendingPool) return;
    setStep('approve');
    try {
      await approve(assetAddress, addresses.LendingPool, maxUint256);
    } catch (error) {
      console.error('授权失败:', error);
      setStep('input');
    }
  };

  // 处理还款
  const handleRepay = async () => {
    if (!assetAddress || parsedAmount <= BigInt(0)) return;

    if (needsApproval) {
      handleApprove();
      return;
    }

    setStep('repaying');
    try {
      await repay(assetAddress, parsedAmount);
    } catch (error) {
      console.error('还款失败:', error);
      setStep('input');
    }
  };

  // 验证输入
  const isValidAmount =
    amount &&
    parseFloat(amount) > 0 &&
    parseFloat(amount) <= parseFloat(formattedBalance) &&
    parseFloat(amount) <= parseFloat(debtBalance);

  // 按钮状态
  const isLoading = approving || approveConfirming || repaying || repayConfirming;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">还款 {asset}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === 'success' ? (
          // 成功状态
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">还款成功!</h3>
            <p className="text-gray-400 mb-4">
              已成功还款 {amount} {asset}
            </p>
            {repayHash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${repayHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                查看交易 →
              </a>
            )}
            <button
              onClick={onClose}
              className="w-full mt-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium transition-colors"
            >
              完成
            </button>
          </div>
        ) : (
          <>
            {/* 输入区域 */}
            <div className="bg-gray-900 rounded-xl p-4 mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>还款金额</span>
                <span>
                  待还: {parseFloat(debtBalance).toFixed(4)} {asset}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-2xl font-semibold outline-none"
                  disabled={isLoading}
                />
                <button
                  onClick={handleMax}
                  className="px-2 py-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  disabled={isLoading}
                >
                  最大
                </button>
                <span className="text-lg font-semibold">{asset}</span>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                钱包余额: {balanceLoading ? '...' : parseFloat(formattedBalance).toFixed(4)} {asset}
              </div>
            </div>

            {/* 还款后影响 */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">当前借款</span>
                <span>{parseFloat(debtBalance).toFixed(4)} {asset}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">还款后借款</span>
                <span className="text-green-400">
                  {Math.max(0, parseFloat(debtBalance) - parseFloat(amount || '0')).toFixed(4)} {asset}
                </span>
              </div>
            </div>

            {/* 错误提示 */}
            {(approveError || repayError) && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-red-400 text-sm">
                {approveError?.message || repayError?.message || '操作失败，请重试'}
              </div>
            )}

            {/* 按钮 */}
            <button
              onClick={handleRepay}
              disabled={!isConnected || !isValidAmount || isLoading}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                !isConnected || !isValidAmount || isLoading
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }`}
            >
              {!isConnected
                ? '请先连接钱包'
                : isLoading
                ? step === 'approve'
                  ? '授权中...'
                  : '还款中...'
                : needsApproval
                ? '授权并还款'
                : '还款'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
