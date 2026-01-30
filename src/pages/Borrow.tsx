import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Link } from 'react-router-dom';
import { useUserAccountData } from '../hooks/useLendingPool';
import { useCreditInfo } from '../hooks/useApiQueries';
import { useBorrowWithCredit } from '../hooks/useLendingPool';
import { api } from '../services/api';
import { SUPPORTED_ASSETS } from '../types';
import type { SignResponse } from '../types';

// 借款步骤
type BorrowStep = 'select' | 'credit' | 'simulate' | 'confirm';

const STEP_LABELS = ['选择资产', '信用检查', '风险模拟', '确认借款'];
const STEP_KEYS: BorrowStep[] = ['select', 'credit', 'simulate', 'confirm'];

// 模拟的资产地址映射（实际项目中应从配置获取）
const ASSET_ADDRESS_MAP: Record<string, `0x${string}`> = {
  USDT: '0x0000000000000000000000000000000000000001' as `0x${string}`,
  USDC: '0x0000000000000000000000000000000000000002' as `0x${string}`,
  ETH: '0x0000000000000000000000000000000000000003' as `0x${string}`,
  WBTC: '0x0000000000000000000000000000000000000004' as `0x${string}`,
};

export default function Borrow() {
  const { isConnected, address } = useAccount();
  const { data: accountData, isLoading } = useUserAccountData();
  const { data: creditInfo } = useCreditInfo();
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
  const totalCollateral = parseFloat(accountData?.totalCollateralUSD || '0');
  const totalDebt = parseFloat(accountData?.totalDebtUSD || '0');

  // 资产列表
  const borrowableAssets = useMemo(() => {
    return SUPPORTED_ASSETS.map(asset => ({
      ...asset,
      borrowAPR: (3 + Math.random() * 4).toFixed(2),
      available: Math.floor(100000 + Math.random() * 100000).toLocaleString(),
    }));
  }, []);

  // 当前选中的资产
  const selectedAssetData = useMemo(() => {
    return borrowableAssets.find(a => a.symbol === selectedAsset);
  }, [borrowableAssets, selectedAsset]);

  // 模拟借款后的健康因子
  const simulatedHealthFactor = useMemo(() => {
    const amount = parseFloat(borrowAmount) || 0;
    if (amount === 0 || totalCollateral === 0) return currentHealthFactor;

    // 简化的健康因子计算: HF = (抵押品价值 * 清算阈值) / (债务 + 新借款)
    const liquidationThreshold = 0.8; // 假设80%清算阈值
    const newTotalDebt = totalDebt + amount;
    if (newTotalDebt === 0) return 0; // 表示无限大
    return (totalCollateral * liquidationThreshold) / newTotalDebt;
  }, [borrowAmount, totalCollateral, totalDebt, currentHealthFactor]);

  // 信用检查流程
  const handleCreditCheck = useCallback(async () => {
    if (!selectedAsset || !borrowAmount || !address) return;

    setCreditCheckStatus('checking');
    setCreditCheckMessage('正在连接信用评估服务...');

    // 模拟请求延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    setCreditCheckMessage('正在验证链上身份...');
    await new Promise(resolve => setTimeout(resolve, 600));
    setCreditCheckMessage('正在计算信用评分...');
    await new Promise(resolve => setTimeout(resolve, 700));

    try {
      const result = await api.requestCreditSign({
        market: selectedAsset,
        amount: borrowAmount,
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
      setTimeout(() => setStep('simulate'), 500);
    } catch {
      setCreditCheckStatus('error');
      setCreditCheckMessage('信用检查服务暂时不可用');
    }
  }, [selectedAsset, borrowAmount, address]);

  // 确认借款
  const handleConfirmBorrow = useCallback(async () => {
    if (!selectedAsset || !borrowAmount || !signatureData || !address) return;

    const assetAddress = ASSET_ADDRESS_MAP[selectedAsset];
    if (!assetAddress) return;

    const asset = SUPPORTED_ASSETS.find(a => a.symbol === selectedAsset);
    if (!asset) return;

    // 转换金额为 BigInt（根据代币精度）
    const amount = BigInt(Math.floor(parseFloat(borrowAmount) * 10 ** asset.decimals));

    await borrowWithCredit(
      assetAddress,
      amount,
      BigInt(signatureData.ltv),
      BigInt(signatureData.amountCap),
      BigInt(signatureData.nonce),
      BigInt(signatureData.deadline),
      signatureData.signature as `0x${string}`
    );
  }, [selectedAsset, borrowAmount, signatureData, address, borrowWithCredit]);

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
        return selectedAsset && parseFloat(borrowAmount) > 0 && parseFloat(borrowAmount) <= availableBorrow;
      case 'credit':
        return creditCheckStatus === 'success';
      case 'simulate':
        return simulatedHealthFactor > 1.05 || simulatedHealthFactor === 0;
      case 'confirm':
        return !isPending && !isConfirming;
      default:
        return false;
    }
  }, [step, selectedAsset, borrowAmount, availableBorrow, creditCheckStatus, simulatedHealthFactor, isPending, isConfirming]);

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
          ) : (
            <HealthFactorDisplay value={currentHealthFactor} />
          )}
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500 mb-1">信用等级</div>
          <div className="flex items-center gap-2">
            <CreditTierBadge tier={creditInfo?.tier || 'C'} />
            <span className="text-sm text-slate-400">{creditInfo?.score || 500}分</span>
          </div>
        </div>
      </div>

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
              {borrowableAssets.map(asset => (
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
                      <div className="text-xs text-slate-500">可借数量</div>
                      <div className="font-medium text-slate-100 tabular-nums">{asset.available}</div>
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
                <label className="block text-sm font-medium text-slate-300 mb-2">借款金额 (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    value={borrowAmount}
                    onChange={(e) => setBorrowAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-24 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-500 tabular-nums"
                  />
                  <button
                    onClick={() => setBorrowAmount(availableBorrow.toString())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium text-primary-400 bg-primary-500/10 rounded hover:bg-primary-500/20 transition-colors"
                  >
                    最大
                  </button>
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  <span>最小: $10.00</span>
                  <span>最大: ${availableBorrow.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
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

        {/* Step 3: 风险模拟 */}
        {step === 'simulate' && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="font-semibold text-slate-100 mb-1">风险模拟器</h3>
              <p className="text-sm text-slate-400">调整借款金额，查看对健康因子的影响</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 左侧：滑块和输入 */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">借款金额</label>
                  <input
                    type="range"
                    min="0"
                    max={availableBorrow}
                    step="10"
                    value={borrowAmount}
                    onChange={(e) => setBorrowAmount(e.target.value)}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                  <div className="flex justify-between mt-2 text-xs text-slate-500">
                    <span>$0</span>
                    <span>${availableBorrow.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">借款资产</span>
                    <span className="font-medium text-slate-100">{selectedAsset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">借款金额</span>
                    <span className="font-semibold text-slate-100 tabular-nums">
                      ${parseFloat(borrowAmount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">借款 APR</span>
                    <span className="font-medium text-danger-400">{selectedAssetData?.borrowAPR}%</span>
                  </div>
                  <div className="border-t border-slate-700 pt-3 flex justify-between">
                    <span className="text-slate-400">预计日利息</span>
                    <span className="font-medium text-slate-100 tabular-nums">
                      ${((parseFloat(borrowAmount || '0') * parseFloat(selectedAssetData?.borrowAPR || '0') / 100) / 365).toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 右侧：健康因子可视化 */}
              <div className="bg-slate-800/30 rounded-xl p-6">
                <div className="text-center mb-6">
                  <div className="text-sm text-slate-400 mb-2">借款后健康因子</div>
                  <HealthFactorGauge value={simulatedHealthFactor} />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">当前健康因子</span>
                    <HealthFactorDisplay value={currentHealthFactor} size="small" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">借款后健康因子</span>
                    <HealthFactorDisplay value={simulatedHealthFactor} size="small" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">清算阈值</span>
                    <span className="text-sm font-medium text-danger-400">1.00</span>
                  </div>
                </div>

                {simulatedHealthFactor > 0 && simulatedHealthFactor < 1.15 && (
                  <div className="mt-4 p-3 rounded-lg bg-danger-500/10 border border-danger-500/30">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-danger-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="text-sm text-danger-300">
                        健康因子过低！您的仓位可能面临清算风险，建议减少借款金额。
                      </div>
                    </div>
                  </div>
                )}
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
                    ${parseFloat(borrowAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">借款 APR</span>
                  <span className="font-medium text-danger-400">{selectedAssetData?.borrowAPR}%</span>
                </div>
                <div className="border-t border-slate-700 pt-4 flex justify-between">
                  <span className="text-slate-400">信用增强 LTV</span>
                  <span className="font-medium text-success-400">{signatureData?.ltv ? signatureData.ltv / 100 : 70}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">借款后健康因子</span>
                  <HealthFactorDisplay value={simulatedHealthFactor} size="small" />
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
                disabled={isPending || isConfirming || isSuccess}
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

// 健康因子仪表盘
function HealthFactorGauge({ value }: { value: number }) {
  const displayValue = value === 0 ? '∞' : value.toFixed(2);
  const percentage = value === 0 ? 100 : Math.min(100, (value / 3) * 100);

  let colorClass = 'text-success-400';

  if (value > 0) {
    if (value < 1.15) {
      colorClass = 'text-danger-400';
    } else if (value < 1.5) {
      colorClass = 'text-warning-400';
    } else if (value < 2) {
      colorClass = 'text-info-400';
    }
  }

  return (
    <div className="relative w-40 h-40 mx-auto">
      {/* 背景圆环 */}
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-slate-700"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${percentage * 2.51} 251`}
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" className={`stop-color: var(--tw-gradient-from)`} stopColor="currentColor" />
            <stop offset="100%" className={`stop-color: var(--tw-gradient-to)`} stopColor="currentColor" />
          </linearGradient>
        </defs>
      </svg>
      {/* 中心数值 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold tabular-nums ${colorClass}`}>{displayValue}</span>
        <span className="text-xs text-slate-500">健康因子</span>
      </div>
    </div>
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
