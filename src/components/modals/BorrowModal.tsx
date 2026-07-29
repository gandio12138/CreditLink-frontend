import { useState, useEffect, useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { keccak256, parseUnits, toBytes } from 'viem';
import { getAssetAddress } from '../../config/contracts';
import { useBorrowWithCredit, useUserAccountData } from '../../hooks/useLendingPool';
import { useCreditInfo, useMarketStats } from '../../hooks/useApiQueries';
import { api } from '../../services/api';
import { SUPPORTED_ASSETS } from '../../types';

interface BorrowModalProps {
  asset: string;
  onClose: () => void;
}

export default function BorrowModal({ asset, onClose }: BorrowModalProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { data: creditInfo, isLoading: creditLoading, isError: creditError } = useCreditInfo();
  const { data: marketResponse, isLoading: marketLoading, isError: marketError } = useMarketStats();

  const assetInfo = SUPPORTED_ASSETS.find((a) => a.symbol === asset);
  const assetAddress = getAssetAddress(chainId, asset);
  const marketData = marketResponse?.markets.find((market) => market.symbol === asset);

  const [amount, setAmount] = useState('');
  const [requestError, setRequestError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'signing' | 'borrowing' | 'success'>('input');
  const [signatureData, setSignatureData] = useState<{
    signature: string;
    market: string;
    ltv: number;
    amountCap: string;
    nonce: string;
    deadline: number;
  } | null>(null);

  // 获取账户数据
  const { data: accountData, isLoading: accountLoading, isError: accountError } = useUserAccountData();

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
    if (creditBorrowSuccess) {
      setStep('success');
    }
  }, [creditBorrowSuccess]);

  // 监听借款失败（包括用户取消）
  useEffect(() => {
    if (creditBorrowError) {
      setStep('input');
    }
  }, [creditBorrowError]);

  // 解析输入金额
  const parsedAmount = useMemo(() => {
    if (!amount || !assetInfo) return null;
    try {
      return parseUnits(amount, assetInfo.decimals);
    } catch {
      return null;
    }
  }, [amount, assetInfo]);

  // 可借额度
  const availableBorrow = accountData?.availableBorrowUSD;

  // 获取签名并借款
  const handleCreditBorrow = async () => {
    if (!assetAddress || !marketData || !parsedAmount || parsedAmount <= 0n) return;

    // 重置之前的错误状态
    resetCreditBorrow();
    setRequestError(null);
    setStep('signing');
    try {
      // 请求签名
      const result = await api.requestCreditSign({
        market: marketData.symbol,
        amount: parsedAmount.toString(),
      });

      if (result.error || !result.data) {
        throw new Error(result.error || '获取签名失败');
      }

      setSignatureData(result.data);
      setStep('borrowing');

      const signedMarketId = keccak256(toBytes(result.data.market));

      // 执行信用借款
      await borrowWithCredit(
        assetAddress,
        parsedAmount,
        signedMarketId,
        BigInt(result.data.ltv),
        BigInt(result.data.amountCap),
        BigInt(result.data.nonce),
        BigInt(result.data.deadline),
        result.data.signature as `0x${string}`
      );
    } catch (error) {
      console.error('信用借款失败:', error);
      setRequestError(error instanceof Error ? error.message : '信用借款失败');
      setStep('input');
    }
  };

  // 验证输入
  const isDataUnavailable = !assetInfo || !assetAddress || !marketData || !creditInfo || !accountData ||
    creditInfo.tier === 'D' || accountLoading || creditLoading || marketLoading ||
    accountError || creditError || marketError;
  const isValidAmount = !!parsedAmount && parsedAmount > 0n;

  // 按钮状态 - 包含 'borrowing' 步骤以防止在交易确认期间重复点击
  const isLoading = creditBorrowing || creditBorrowConfirming || step === 'signing' || step === 'borrowing';

  // 错误信息
  const error = creditBorrowError;

  // 交易hash
  const hash = creditBorrowHash;

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
              {signatureData && (
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
            {/* 输入区域 */}
            <div className="bg-gray-900 rounded-xl p-4 mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>借款金额</span>
                <span>
                  账户可借: {availableBorrow == null ? '--' : `$${parseFloat(availableBorrow).toFixed(2)} USD`}
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
            {creditInfo && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-purple-400 font-semibold">信用等级: {creditInfo.tier}</span>
                  <span className="text-sm text-gray-400">({creditInfo.score}分)</span>
                </div>
                <div className="text-sm text-gray-300">
                  您的信用LTV为 <span className="text-purple-400 font-semibold">{creditInfo.maxLtv / 100}%</span>
                  {marketData ? `，市场基础 LTV 为 ${marketData.ltv / 100}%` : ''}
                </div>
              </div>
            )}

            {/* 信息 */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">借款APR</span>
                <span className="text-yellow-400">{marketData ? `${marketData.borrowAPR}%` : '--'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">LTV</span>
                <span>
                  {creditInfo ? `${creditInfo.maxLtv / 100}% (信用)` : '--'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">清算阈值</span>
                <span>{marketData ? `${marketData.liquidationLtv / 100}%` : '--'}</span>
              </div>
            </div>

            {isDataUnavailable && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-red-400 text-sm">
                当前市场、信用、预言机或新版合约地址不可用，借款已停用。
              </div>
            )}

            {/* 错误提示 */}
            {(error || requestError) && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-red-400 text-sm">
                {requestError || error?.message || '操作失败，请重试'}
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
              onClick={handleCreditBorrow}
              disabled={!isConnected || !isValidAmount || isLoading || isDataUnavailable}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                !isConnected || !isValidAmount || isLoading || isDataUnavailable
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
                : isDataUnavailable
                ? '数据或合约未配置'
                : '信用借款'}
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
