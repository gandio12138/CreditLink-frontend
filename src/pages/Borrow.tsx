import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Link } from 'react-router-dom';
import { keccak256, parseUnits, toBytes } from 'viem';
import { useUserAccountData } from '../hooks/useLendingPool';
import { useCreditInfo, useMarketStats } from '../hooks/useApiQueries';
import { useBorrowWithCredit } from '../hooks/useLendingPool';
import { api } from '../services/api';
import { getAssetAddress } from '../config/contracts';
import { SUPPORTED_ASSETS } from '../types';
import type { SignResponse } from '../types';

// 借款步骤
type BorrowStep = 'select' | 'credit' | 'simulate' | 'confirm';

const STEP_LABELS = ['选择资产', '信用检查', '链上校验', '确认借款'];
const STEP_KEYS: BorrowStep[] = ['select', 'credit', 'simulate', 'confirm'];

export default function Borrow() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { data: accountData, isLoading, isError: isAccountError } = useUserAccountData();
  const { data: creditInfo, isError: isCreditError } = useCreditInfo();
  const {
    data: marketResponse,
    isLoading: isMarketLoading,
    isError: isMarketError,
  } = useMarketStats();
  const { borrowWithCredit, isPending, isConfirming, isSuccess, error, reset } = useBorrowWithCredit();

  // 向导状态
  const [step, setStep] = useState<BorrowStep>('select');
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [borrowAmount, setBorrowAmount] = useState('');
  const [signatureData, setSignatureData] = useState<SignResponse | null>(null);
  const [creditCheckStatus, setCreditCheckStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [creditCheckMessage, setCreditCheckMessage] = useState('');

  // 计算可借款额度
  const availableBorrow = parseFloat(accountData?.availableBorrowUSD || '0');
  const currentHealthFactor = parseFloat(accountData?.healthFactor || '0');
  const totalDebt = parseFloat(accountData?.totalDebtUSD || '0');

  // 只展示后端实际返回且当前链已配置合约地址的市场。
  const borrowableAssets = useMemo(() => {
    return (marketResponse?.markets ?? []).flatMap((market) => {
      const asset = SUPPORTED_ASSETS.find((item) => item.symbol === market.symbol);
      const assetAddress = getAssetAddress(chainId, market.symbol);
      if (!asset || !assetAddress) return [];

      const availableLiquidityUSD = Math.max(
        0,
        parseFloat(market.totalSupply) - parseFloat(market.totalBorrow),
      );
      return [{ ...asset, ...market, assetAddress, availableLiquidityUSD }];
    });
  }, [chainId, marketResponse]);

  // 当前选中的资产
  const selectedAssetData = useMemo(() => {
    return borrowableAssets.find(a => a.symbol === selectedAsset);
  }, [borrowableAssets, selectedAsset]);

  const parsedBorrowAmount = useMemo(() => {
    if (!selectedAssetData || !borrowAmount) return null;
    try {
      return parseUnits(borrowAmount, selectedAssetData.decimals);
    } catch {
      return null;
    }
  }, [borrowAmount, selectedAssetData]);

  const marketId = signatureData
    ? keccak256(toBytes(signatureData.market))
    : null;

  const requiredDataAvailable = !!accountData && !!creditInfo && !!marketResponse &&
    !isAccountError && !isCreditError && !isMarketError;

  // 信用检查流程
  const handleCreditCheck = useCallback(async () => {
    if (!selectedAssetData || !parsedBorrowAmount || parsedBorrowAmount <= 0n || !address) return;

    setCreditCheckStatus('checking');
    setCreditCheckMessage('正在请求信用授权签名...');

    try {
      const result = await api.requestCreditSign({
        market: selectedAssetData.symbol,
        amount: parsedBorrowAmount.toString(),
      });

      if (result.error || !result.data) {
        setCreditCheckStatus('error');
        setCreditCheckMessage(result.error || '信用检查失败');
        return;
      }

      setCreditCheckMessage('信用检查通过！');
      setSignatureData(result.data);
      setCreditCheckStatus('success');

      // 自动进入下一步
      setStep('simulate');
    } catch {
      setCreditCheckStatus('error');
      setCreditCheckMessage('信用检查服务暂时不可用');
    }
  }, [selectedAssetData, parsedBorrowAmount, address]);

  // 确认借款
  const handleConfirmBorrow = useCallback(async () => {
    if (!requiredDataAvailable || !selectedAssetData || !parsedBorrowAmount || !marketId || !signatureData || !address) return;

    await borrowWithCredit(
      selectedAssetData.assetAddress,
      parsedBorrowAmount,
      marketId,
      BigInt(signatureData.ltv),
      BigInt(signatureData.amountCap),
      BigInt(signatureData.nonce),
      BigInt(signatureData.deadline),
      signatureData.signature as `0x${string}`
    );
  }, [requiredDataAvailable, selectedAssetData, parsedBorrowAmount, marketId, signatureData, address, borrowWithCredit]);

  // 交易成功后重置
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        setStep('select');
        setSelectedAsset(null);
        setBorrowAmount('');
        setSignatureData(null);
        setCreditCheckStatus('idle');
        reset();
      }, 3000);
    }
  }, [isSuccess, reset]);

  // 进入信用检查步骤时自动开始检查
  useEffect(() => {
    if (step === 'credit' && creditCheckStatus === 'idle') {
      handleCreditCheck();
    }
  }, [step, creditCheckStatus, handleCreditCheck]);

  // 导航函数
  const goToStep = (targetStep: BorrowStep) => {
    const currentIndex = STEP_KEYS.indexOf(step);
    const targetIndex = STEP_KEYS.indexOf(targetStep);

    // 只能向前或向后一步
    if (targetIndex === currentIndex - 1) {
      if (targetStep === 'select') {
        setCreditCheckStatus('idle');
        setSignatureData(null);
      }
      setStep(targetStep);
    }
  };

  const canProceed = useMemo(() => {
    switch (step) {
      case 'select':
        return !!selectedAssetData && !!parsedBorrowAmount && parsedBorrowAmount > 0n &&
          !!accountData && !!creditInfo && creditInfo.tier !== 'D' && availableBorrow > 0 &&
          !isAccountError && !isCreditError && !isMarketError;
      case 'credit':
        return creditCheckStatus === 'success';
      case 'simulate':
        return requiredDataAvailable && !!signatureData && !!selectedAssetData && !!marketId && !!parsedBorrowAmount;
      case 'confirm':
        return requiredDataAvailable && !!signatureData && !!selectedAssetData && !!marketId && !!parsedBorrowAmount &&
          !isPending && !isConfirming;
      default:
        return false;
    }
  }, [
    step,
    selectedAssetData,
    parsedBorrowAmount,
    accountData,
    creditInfo,
    availableBorrow,
    isAccountError,
    isCreditError,
    isMarketError,
    creditCheckStatus,
    signatureData,
    marketId,
    isPending,
    isConfirming,
    requiredDataAvailable,
  ]);

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">连接钱包</h2>
          <p className="text-slate-400 mb-6">请先连接您的钱包以开始借款</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">借款向导</h1>
          <p className="text-slate-400 mt-1">使用信用增强借款，享受更高 LTV</p>
        </div>
        <Link to="/credit" className="btn-secondary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          信用中心
        </Link>
      </div>

      {/* 借款能力概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-xs text-slate-500 mb-1">可借款额度</div>
          {isLoading ? (
            <div className="h-6 w-20 skeleton rounded" />
          ) : isAccountError || !accountData ? (
            <div className="text-lg font-semibold text-slate-500">--</div>
          ) : (
            <div className="text-lg font-semibold text-slate-100 tabular-nums">
              ${availableBorrow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )}
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500 mb-1">当前借款</div>
          {isLoading ? (
            <div className="h-6 w-20 skeleton rounded" />
          ) : isAccountError || !accountData ? (
            <div className="text-lg font-semibold text-slate-500">--</div>
          ) : (
            <div className="text-lg font-semibold text-danger-400 tabular-nums">
              ${totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )}
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500 mb-1">健康因子</div>
          {isLoading ? (
            <div className="h-6 w-16 skeleton rounded" />
          ) : isAccountError || !accountData ? (
            <div className="text-lg font-semibold text-slate-500">--</div>
          ) : (
            <HealthFactorDisplay value={currentHealthFactor} />
          )}
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500 mb-1">信用等级</div>
          {isCreditError || !creditInfo ? (
            <div className="text-lg font-semibold text-slate-500">--</div>
          ) : (
            <div className="flex items-center gap-2">
              <CreditTierBadge tier={creditInfo.tier} />
              <span className="text-sm text-slate-400">{creditInfo.score}分</span>
            </div>
          )}
        </div>
      </div>

      {(isAccountError || isCreditError || isMarketError) && (
        <div className="p-4 rounded-xl bg-danger-500/10 border border-danger-500/30 text-danger-300 text-sm">
          链上账户、信用或市场数据不可用，已停用借款操作。请检查预言机和当前网络配置。
        </div>
      )}

      {/* 步骤指示器 */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          {STEP_LABELS.map((label, index) => {
            const currentIndex = STEP_KEYS.indexOf(step);
            const isActive = currentIndex >= index;
            const isCurrent = currentIndex === index;

            return (
              <div key={label} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 ${isActive ? 'text-primary-400' : 'text-slate-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    isCurrent
                      ? 'bg-primary-500 text-white ring-2 ring-primary-500/30'
                      : isActive
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'bg-slate-800 text-slate-500'
                  }`}>
                    {isActive && currentIndex > index ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">{label}</span>
                </div>
                {index < 3 && (
                  <div className={`flex-1 h-px mx-4 transition-colors ${isActive ? 'bg-primary-500/50' : 'bg-slate-700'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 步骤内容 */}
      <div className="card">
        {/* Step 1: 选择资产 */}
        {step === 'select' && (
          <div>
            <div className="p-4 border-b border-slate-700/50">
              <h2 className="font-semibold text-slate-100">选择借款资产</h2>
              <p className="text-sm text-slate-400 mt-1">选择您需要借入的资产，并输入借款金额</p>
            </div>

            <div className="divide-y divide-slate-700/50">
              {isMarketLoading ? (
                <div className="p-8 text-center text-slate-500">正在加载市场数据...</div>
              ) : borrowableAssets.length === 0 ? (
                <div className="p-8 text-center text-slate-500">当前网络暂无已配置的可借市场</div>
              ) : borrowableAssets.map(asset => (
                <div
                  key={asset.symbol}
                  className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                    selectedAsset === asset.symbol
                      ? 'bg-primary-500/10 border-l-2 border-l-primary-500'
                      : 'hover:bg-slate-800/30'
                  }`}
                  onClick={() => setSelectedAsset(asset.symbol)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                      selectedAsset === asset.symbol ? 'bg-primary-500/20' : 'bg-slate-800'
                    }`}>
                      {asset.icon}
                    </div>
                    <div>
                      <div className="font-medium text-slate-100">{asset.symbol}</div>
                      <div className="text-sm text-slate-500">{asset.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">借款 APR</div>
                      <div className="font-medium text-danger-400 tabular-nums">{asset.borrowAPR}%</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-slate-500">可用流动性 (USD)</div>
                      <div className="font-medium text-slate-100 tabular-nums">
                        ${asset.availableLiquidityUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedAsset === asset.symbol
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-slate-600'
                    }`}>
                      {selectedAsset === asset.symbol && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 借款金额输入 */}
            {selectedAsset && (
              <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
                <label className="block text-sm font-medium text-slate-300 mb-2">借款数量 ({selectedAsset})</label>
                <div className="relative">
                  <input
                    type="number"
                    value={borrowAmount}
                    onChange={(e) => setBorrowAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-500 tabular-nums"
                  />
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  账户可借上限：${availableBorrow.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD；资产数量将由合约按最新预言机价格校验。
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: 信用检查 */}
        {step === 'credit' && (
          <div className="p-8">
            <div className="max-w-md mx-auto text-center">
              {creditCheckStatus === 'checking' && (
                <>
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-500/10 flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">信用检查中</h3>
                  <p className="text-slate-400 mb-6">{creditCheckMessage}</p>

                  {/* 进度指示 */}
                  <div className="space-y-3">
                    <ProgressItem label="连接信用服务" status="complete" />
                    <ProgressItem label="验证链上身份" status={creditCheckMessage.includes('身份') ? 'active' : 'pending'} />
                    <ProgressItem label="计算信用评分" status={creditCheckMessage.includes('评分') ? 'active' : 'pending'} />
                    <ProgressItem label="生成签名授权" status="pending" />
                  </div>
                </>
              )}

              {creditCheckStatus === 'success' && (
                <>
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success-500/10 flex items-center justify-center">
                    <svg className="w-10 h-10 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-success-400 mb-2">信用检查通过</h3>
                  <p className="text-slate-400 mb-6">您的信用评分允许此次借款</p>

                  {signatureData && (
                    <div className="bg-slate-800/50 rounded-xl p-4 text-left space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">信用等级</span>
                        <CreditTierBadge tier={signatureData.creditTier as 'S'|'A'|'B'|'C'|'D'} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">信用评分</span>
                        <span className="text-slate-100 font-medium">{signatureData.creditScore} 分</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">授权 LTV</span>
                        <span className="text-success-400 font-medium">{signatureData.ltv / 100}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">授权有效期</span>
                        <span className="text-slate-100">{new Date(signatureData.deadline * 1000).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {creditCheckStatus === 'error' && (
                <>
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-danger-500/10 flex items-center justify-center">
                    <svg className="w-10 h-10 text-danger-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-danger-400 mb-2">信用检查失败</h3>
                  <p className="text-slate-400 mb-6">{creditCheckMessage}</p>
                  <button
                    onClick={() => {
                      setCreditCheckStatus('idle');
                      handleCreditCheck();
                    }}
                    className="btn-primary"
                  >
                    重试
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 3: 链上风险校验 */}
        {step === 'simulate' && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="font-semibold text-slate-100 mb-1">链上风险校验</h3>
              <p className="text-sm text-slate-400">以下数值来自市场 API 和当前链上账户</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">借款资产</span>
                    <span className="font-medium text-slate-100">{selectedAsset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">借款金额</span>
                    <span className="font-semibold text-slate-100 tabular-nums">
                      {borrowAmount} {selectedAsset}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">借款 APR</span>
                    <span className="font-medium text-danger-400">{selectedAssetData?.borrowAPR}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">基础 LTV</span>
                    <span className="font-medium text-slate-100">{selectedAssetData ? selectedAssetData.ltv / 100 : '--'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">清算 LTV</span>
                    <span className="font-medium text-danger-400">{selectedAssetData ? selectedAssetData.liquidationLtv / 100 : '--'}%</span>
                  </div>
              </div>

              <div className="bg-slate-800/30 rounded-xl p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">当前健康因子</span>
                    <HealthFactorDisplay value={currentHealthFactor} size="small" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">账户可借额度</span>
                    <span className="text-sm font-medium text-slate-100">${availableBorrow.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD</span>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-info-500/10 border border-info-500/30 text-sm text-info-300">
                  借款后的精确健康因子需要最新资产价格。前端不伪造估算值，最终由 LendingPool 使用预言机数据校验，不安全的交易会 revert。
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: 确认借款 */}
        {step === 'confirm' && (
          <div className="p-6">
            <div className="max-w-lg mx-auto">
              <h3 className="font-semibold text-slate-100 mb-6 text-center">确认借款信息</h3>

              <div className="bg-slate-800/50 rounded-xl p-6 space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-400">借款资产</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{selectedAssetData?.icon}</span>
                    <span className="font-medium text-slate-100">{selectedAsset}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">借款金额</span>
                  <span className="font-semibold text-slate-100 text-lg tabular-nums">
                    {borrowAmount} {selectedAsset}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">借款 APR</span>
                  <span className="font-medium text-danger-400">{selectedAssetData?.borrowAPR}%</span>
                </div>
                <div className="border-t border-slate-700 pt-4 flex justify-between">
                  <span className="text-slate-400">信用增强 LTV</span>
                  <span className="font-medium text-success-400">{signatureData ? signatureData.ltv / 100 : '--'}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">借款后健康因子</span>
                  <span className="text-sm font-medium text-slate-400">由链上预言机校验</span>
                </div>
              </div>

              {/* 交易状态 */}
              {isPending && (
                <div className="flex items-center justify-center gap-3 p-4 mb-4 bg-primary-500/10 rounded-xl">
                  <svg className="w-5 h-5 text-primary-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-primary-400">请在钱包中确认交易...</span>
                </div>
              )}

              {isConfirming && (
                <div className="flex items-center justify-center gap-3 p-4 mb-4 bg-info-500/10 rounded-xl">
                  <svg className="w-5 h-5 text-info-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-info-400">交易确认中...</span>
                </div>
              )}

              {isSuccess && (
                <div className="flex items-center justify-center gap-3 p-4 mb-4 bg-success-500/10 rounded-xl">
                  <svg className="w-5 h-5 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-success-400">借款成功！</span>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-center gap-3 p-4 mb-4 bg-danger-500/10 rounded-xl">
                  <svg className="w-5 h-5 text-danger-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-danger-400">交易失败：{error.message}</span>
                </div>
              )}

              <button
                onClick={handleConfirmBorrow}
                disabled={!canProceed || isSuccess}
                className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? '等待签名...' : isConfirming ? '确认中...' : isSuccess ? '借款成功' : '确认借款'}
              </button>

              <p className="text-xs text-slate-500 text-center mt-4">
                点击确认后，您需要在钱包中签署 EIP-712 签名以完成借款
              </p>
            </div>
          </div>
        )}

        {/* 导航按钮 */}
        {!isSuccess && (
          <div className="flex justify-between p-4 border-t border-slate-700/50">
            <button
              onClick={() => goToStep(STEP_KEYS[STEP_KEYS.indexOf(step) - 1])}
              disabled={step === 'select'}
              className="btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              上一步
            </button>

            {step !== 'confirm' && (
              <button
                onClick={() => {
                  const nextStep = STEP_KEYS[STEP_KEYS.indexOf(step) + 1];
                  if (nextStep) setStep(nextStep);
                }}
                disabled={!canProceed}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一步
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 健康因子显示组件
function HealthFactorDisplay({ value, size = 'large' }: { value: number; size?: 'large' | 'small' }) {
  let colorClass = 'text-success-400';
  let displayValue = '∞';

  if (value > 0) {
    displayValue = value.toFixed(2);
    if (value < 1.15) {
      colorClass = 'text-danger-400';
    } else if (value < 1.5) {
      colorClass = 'text-warning-400';
    } else if (value < 2) {
      colorClass = 'text-info-400';
    }
  }

  const sizeClass = size === 'large' ? 'text-2xl font-semibold' : 'text-sm font-medium';

  return (
    <span className={`tabular-nums ${colorClass} ${sizeClass}`}>
      {displayValue}
    </span>
  );
}

// 信用等级徽章
function CreditTierBadge({ tier }: { tier: 'S' | 'A' | 'B' | 'C' | 'D' }) {
  const styles: Record<string, string> = {
    S: 'text-accent-400 bg-accent-500/10',
    A: 'text-success-400 bg-success-500/10',
    B: 'text-info-400 bg-info-500/10',
    C: 'text-warning-400 bg-warning-500/10',
    D: 'text-danger-400 bg-danger-500/10',
  };

  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold ${styles[tier]}`}>
      {tier}
    </span>
  );
}

// 进度项组件
function ProgressItem({ label, status }: { label: string; status: 'pending' | 'active' | 'complete' }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
        status === 'complete'
          ? 'bg-success-500/20 text-success-400'
          : status === 'active'
            ? 'bg-primary-500/20 text-primary-400'
            : 'bg-slate-800 text-slate-600'
      }`}>
        {status === 'complete' ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : status === 'active' ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <div className="w-2 h-2 rounded-full bg-slate-600" />
        )}
      </div>
      <span className={`text-sm ${
        status === 'complete'
          ? 'text-success-400'
          : status === 'active'
            ? 'text-primary-400'
            : 'text-slate-500'
      }`}>
        {label}
      </span>
    </div>
  );
}
