import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { getContractAddresses } from '../../config/contracts';
import { useWithdraw, useUserReserveData } from '../../hooks/useLendingPool';
import { SUPPORTED_ASSETS } from '../../types';

interface WithdrawModalProps {
  asset: string;
  onClose: () => void;
}

export default function WithdrawModal({ asset, onClose }: WithdrawModalProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const assetInfo = SUPPORTED_ASSETS.find((a) => a.symbol === asset);
  const assetAddress = addresses[asset as keyof typeof addresses] as `0x${string}`;

  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'withdrawing' | 'success'>('input');

  // 获取用户存款余额
  const { data: userReserveData, isLoading: balanceLoading, refetch: refetchBalance } = useUserReserveData(assetAddress);

  // 提款hook
  const {
    withdraw,
    isPending: withdrawing,
    isConfirming: withdrawConfirming,
    isSuccess: withdrawSuccess,
    hash: withdrawHash,
    error: withdrawError,
  } = useWithdraw();

  // 监听提款成功
  useEffect(() => {
    if (withdrawSuccess) {
      setStep('success');
      refetchBalance();
    }
  }, [withdrawSuccess, refetchBalance]);

  // 格式化存款余额
  const depositedBalance = userReserveData
    ? formatUnits(userReserveData.currentCTokenBalance, assetInfo?.decimals || 18)
    : '0';

  // 解析输入金额
  const parsedAmount = amount
    ? parseUnits(amount, assetInfo?.decimals || 18)
    : BigInt(0);

  // 处理最大金额
  const handleMax = () => {
    setAmount(depositedBalance);
  };

  // 处理提款
  const handleWithdraw = async () => {
    if (!assetAddress || parsedAmount <= BigInt(0)) return;

    setStep('withdrawing');
    try {
      await withdraw(assetAddress, parsedAmount);
    } catch (error) {
      console.error('提款失败:', error);
      setStep('input');
    }
  };

  // 验证输入
  const isValidAmount = amount && parseFloat(amount) > 0 && parseFloat(amount) <= parseFloat(depositedBalance);

  // 按钮状态
  const isLoading = withdrawing || withdrawConfirming;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">提款 {asset}</h2>
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
            <h3 className="text-lg font-semibold mb-2">提款成功!</h3>
            <p className="text-gray-400 mb-4">
              已成功提取 {amount} {asset}
            </p>
            {withdrawHash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${withdrawHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                查看交易 →
              </a>
            )}
            <button
              onClick={onClose}
              className="w-full mt-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
            >
              完成
            </button>
          </div>
        ) : (
          <>
            {/* 输入区域 */}
            <div className="bg-gray-900 rounded-xl p-4 mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>提款金额</span>
                <span>
                  已存款: {balanceLoading ? '...' : parseFloat(depositedBalance).toFixed(4)} {asset}
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
            </div>

            {/* 警告提示 */}
            {parseFloat(depositedBalance) > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4 text-yellow-400 text-sm">
                提款后您的抵押品价值会降低，请确保健康因子保持安全
              </div>
            )}

            {/* 错误提示 */}
            {withdrawError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-red-400 text-sm">
                {withdrawError.message || '操作失败，请重试'}
              </div>
            )}

            {/* 按钮 */}
            <button
              onClick={handleWithdraw}
              disabled={!isConnected || !isValidAmount || isLoading}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                !isConnected || !isValidAmount || isLoading
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {!isConnected
                ? '请先连接钱包'
                : isLoading
                ? '提款中...'
                : '提款'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
