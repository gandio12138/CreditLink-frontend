import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { getContractAddresses } from '../../config/contracts';
import { useTokenBalance, useTokenAllowance, useApproveToken, useDeposit } from '../../hooks/useLendingPool';
import { SUPPORTED_ASSETS } from '../../types';

interface DepositModalProps {
  asset: string;
  onClose: () => void;
}

export default function DepositModal({ asset, onClose }: DepositModalProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const assetInfo = SUPPORTED_ASSETS.find((a) => a.symbol === asset);
  const assetAddress = addresses[asset as keyof typeof addresses] as `0x${string}`;

  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'approve' | 'deposit' | 'success'>('input');

  // 获取余额和授权额度
  const { balance, isLoading: balanceLoading, refetch: refetchBalance } = useTokenBalance(assetAddress);
  const { allowance, refetch: refetchAllowance } = useTokenAllowance(
    assetAddress,
    addresses.LendingPool
  );

  // 授权和存款hooks
  const {
    approve,
    isPending: approving,
    isConfirming: approveConfirming,
    isSuccess: approveSuccess,
    error: approveError,
  } = useApproveToken();

  const {
    deposit,
    isPending: depositing,
    isConfirming: depositConfirming,
    isSuccess: depositSuccess,
    hash: depositHash,
    error: depositError,
  } = useDeposit();

  // 监听授权成功
  useEffect(() => {
    if (approveSuccess) {
      refetchAllowance();
      setStep('deposit');
    }
  }, [approveSuccess, refetchAllowance]);

  // 监听存款成功
  useEffect(() => {
    if (depositSuccess) {
      setStep('success');
      refetchBalance();
    }
  }, [depositSuccess, refetchBalance]);

  // 格式化余额
  const formattedBalance = balance
    ? formatUnits(balance, assetInfo?.decimals || 18)
    : '0';

  // 解析输入金额
  const parsedAmount = amount
    ? parseUnits(amount, assetInfo?.decimals || 18)
    : BigInt(0);

  // 检查是否需要授权
  const needsApproval = allowance !== undefined && parsedAmount > BigInt(0) && allowance < parsedAmount;

  // 处理最大金额
  const handleMax = () => {
    setAmount(formattedBalance);
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

  // 处理存款
  const handleDeposit = async () => {
    if (!assetAddress || parsedAmount <= BigInt(0)) return;

    if (needsApproval) {
      handleApprove();
      return;
    }

    setStep('deposit');
    try {
      await deposit(assetAddress, parsedAmount);
    } catch (error) {
      console.error('存款失败:', error);
      setStep('input');
    }
  };

  // 验证输入
  const isValidAmount = amount && parseFloat(amount) > 0 && parseFloat(amount) <= parseFloat(formattedBalance);

  // 按钮状态
  const isLoading = approving || approveConfirming || depositing || depositConfirming;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">存款 {asset}</h2>
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
            <h3 className="text-lg font-semibold mb-2">存款成功!</h3>
            <p className="text-gray-400 mb-4">
              已成功存入 {amount} {asset}
            </p>
            {depositHash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${depositHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                查看交易 →
              </a>
            )}
            <button
              onClick={onClose}
              className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              完成
            </button>
          </div>
        ) : (
          <>
            {/* 输入区域 */}
            <div className="bg-gray-900 rounded-xl p-4 mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>存款金额</span>
                <span>
                  余额: {balanceLoading ? '...' : parseFloat(formattedBalance).toFixed(4)} {asset}
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

            {/* 信息 */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">存款APY</span>
                <span className="text-green-400">3.2%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">作为抵押</span>
                <span>是</span>
              </div>
            </div>

            {/* 错误提示 */}
            {(approveError || depositError) && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-red-400 text-sm">
                {approveError?.message || depositError?.message || '操作失败，请重试'}
              </div>
            )}

            {/* 步骤指示 */}
            {needsApproval && step === 'input' && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4 text-yellow-400 text-sm">
                首次存款需要先授权合约使用您的 {asset}
              </div>
            )}

            {/* 按钮 */}
            <button
              onClick={handleDeposit}
              disabled={!isConnected || !isValidAmount || isLoading}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                !isConnected || !isValidAmount || isLoading
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {!isConnected
                ? '请先连接钱包'
                : isLoading
                ? step === 'approve'
                  ? '授权中...'
                  : '存款中...'
                : needsApproval
                ? '授权并存款'
                : '存款'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
