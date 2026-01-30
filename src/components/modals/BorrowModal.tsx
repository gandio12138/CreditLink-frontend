import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { getContractAddresses } from '../../config/contracts';
import { useBorrow, useBorrowWithCredit, useUserAccountData } from '../../hooks/useLendingPool';
import { useUserStore } from '../../store/useStore';
import { api } from '../../services/api';
import { SUPPORTED_ASSETS } from '../../types';

interface BorrowModalProps {
  asset: string;
  onClose: () => void;
}

export default function BorrowModal({ asset, onClose }: BorrowModalProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const { creditInfo } = useUserStore();

  const assetInfo = SUPPORTED_ASSETS.find((a) => a.symbol === asset);
  const assetAddress = addresses[asset as keyof typeof addresses] as `0x${string}`;

  const [amount, setAmount] = useState('');
  const [useCreditBorrow, setUseCreditBorrow] = useState(true);
  const [step, setStep] = useState<'input' | 'signing' | 'borrowing' | 'success'>('input');
  const [signatureData, setSignatureData] = useState<{
    signature: string;
    ltv: number;
    amountCap: string;
    nonce: number;
    deadline: number;
  } | null>(null);

  // 获取账户数据
  const { data: accountData } = useUserAccountData();

  // 借款hooks
  const {
    borrow,
    isPending: borrowing,
    isConfirming: borrowConfirming,
    isSuccess: borrowSuccess,
    hash: borrowHash,
    error: borrowError,
    reset: resetBorrow,
  } = useBorrow();

  const {
    borrowWithCredit,
    isPending: creditBorrowing,
    isConfirming: creditBorrowConfirming,
    isSuccess: creditBorrowSuccess,
    hash: creditBorrowHash,
    error: creditBorrowError,
    reset: resetCreditBorrow,
  } = useBorrowWithCredit();

  // 监听借款成功
  useEffect(() => {
    if (borrowSuccess || creditBorrowSuccess) {
      setStep('success');
    }
  }, [borrowSuccess, creditBorrowSuccess]);

  // 监听借款失败（包括用户取消）
  useEffect(() => {
    if (borrowError || creditBorrowError) {
      setStep('input');
    }
  }, [borrowError, creditBorrowError]);

  // 解析输入金额
  const parsedAmount = amount
    ? parseUnits(amount, assetInfo?.decimals || 18)
    : BigInt(0);

  // 可借额度
  const availableBorrow = accountData?.availableBorrowUSD || '0';
  const maxBorrowWithCredit = creditInfo?.maxBorrow || '0';

  // 获取签名并借款
  const handleCreditBorrow = async () => {
    if (!assetAddress || parsedAmount <= BigInt(0)) return;

    // 重置之前的错误状态
    resetCreditBorrow();
    setStep('signing');
    try {
      // 请求签名
      const result = await api.requestCreditSign({
        market: asset,
        amount: parsedAmount.toString(),
      });

      if (result.error || !result.data) {
        throw new Error(result.error || '获取签名失败');
      }

      setSignatureData(result.data);
      setStep('borrowing');

      // 执行信用借款
      await borrowWithCredit(
        assetAddress,
        parsedAmount,
        BigInt(result.data.ltv),
        BigInt(result.data.amountCap),
        BigInt(result.data.nonce),
        BigInt(result.data.deadline),
        result.data.signature as `0x${string}`
      );
    } catch (error) {
      console.error('信用借款失败:', error);
      setStep('input');
    }
  };

  // 普通借款
  const handleNormalBorrow = async () => {
    if (!assetAddress || parsedAmount <= BigInt(0)) return;

    // 重置之前的错误状态
    resetBorrow();
    setStep('borrowing');
    try {
      await borrow(assetAddress, parsedAmount);
    } catch (error) {
      console.error('借款失败:', error);
      setStep('input');
    }
  };

  // 处理借款
  const handleBorrow = () => {
    if (useCreditBorrow && creditInfo && creditInfo.tier !== 'D') {
      handleCreditBorrow();
    } else {
      handleNormalBorrow();
    }
  };

  // 验证输入
  const isValidAmount = amount && parseFloat(amount) > 0;

  // 按钮状态 - 包含 'borrowing' 步骤以防止在交易确认期间重复点击
  const isLoading = borrowing || borrowConfirming || creditBorrowing || creditBorrowConfirming || step === 'signing' || step === 'borrowing';

  // 错误信息
  const error = borrowError || creditBorrowError;

  // 交易hash
  const hash = borrowHash || creditBorrowHash;

  // 是否可以使用信用借款
  const canUseCreditBorrow = creditInfo && creditInfo.tier !== 'D';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">借款 {asset}</h2>
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
            <h3 className="text-lg font-semibold mb-2">借款成功!</h3>
            <p className="text-gray-400 mb-4">
              已成功借入 {amount} {asset}
              {useCreditBorrow && signatureData && (
                <span className="block text-sm mt-1">
                  使用信用LTV: {signatureData.ltv / 100}%
                </span>
              )}
            </p>
            {hash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                查看交易 →
              </a>
            )}
            <button
              onClick={onClose}
              className="w-full mt-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
            >
              完成
            </button>
          </div>
        ) : (
          <>
            {/* 借款模式选择 */}
            {canUseCreditBorrow && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setUseCreditBorrow(true)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    useCreditBorrow
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  信用借款
                </button>
                <button
                  onClick={() => setUseCreditBorrow(false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !useCreditBorrow
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  普通借款
                </button>
              </div>
            )}

            {/* 输入区域 */}
            <div className="bg-gray-900 rounded-xl p-4 mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>借款金额</span>
                <span>
                  可借: ${useCreditBorrow ? Number(maxBorrowWithCredit).toLocaleString() : parseFloat(availableBorrow).toFixed(2)}
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
                <span className="text-lg font-semibold">{asset}</span>
              </div>
            </div>

            {/* 信用借款优势 */}
            {useCreditBorrow && creditInfo && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-purple-400 font-semibold">信用等级: {creditInfo.tier}</span>
                  <span className="text-sm text-gray-400">({creditInfo.score}分)</span>
                </div>
                <div className="text-sm text-gray-300">
                  您的信用LTV为 <span className="text-purple-400 font-semibold">{creditInfo.maxLtv / 100}%</span>
                  ，高于基础LTV 70%
                </div>
              </div>
            )}

            {/* 信息 */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">借款APR</span>
                <span className="text-yellow-400">5.1%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">LTV</span>
                <span>
                  {useCreditBorrow && creditInfo
                    ? `${creditInfo.maxLtv / 100}% (信用)`
                    : '70% (基础)'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">清算阈值</span>
                <span>85%</span>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-red-400 text-sm">
                {error.message || '操作失败，请重试'}
              </div>
            )}

            {/* 签名步骤提示 */}
            {step === 'signing' && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4 text-blue-400 text-sm">
                正在请求信用签名...
              </div>
            )}

            {/* 按钮 */}
            <button
              onClick={handleBorrow}
              disabled={!isConnected || !isValidAmount || isLoading}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                !isConnected || !isValidAmount || isLoading
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {!isConnected
                ? '请先连接钱包'
                : isLoading
                ? step === 'signing'
                  ? '获取签名中...'
                  : '借款中...'
                : useCreditBorrow
                ? '信用借款'
                : '借款'}
            </button>

            {/* 风险提示 */}
            <p className="text-xs text-gray-500 mt-4 text-center">
              请确保您的健康因子保持在安全范围内，低于1将触发清算
            </p>
          </>
        )}
      </div>
    </div>
  );
}
