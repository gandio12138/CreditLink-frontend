import { useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useModalStore } from '../store/useStore';
import { useUserAccountData } from '../hooks/useLendingPool';
import { useMarketStats, useUserPositions } from '../hooks/useApiQueries';
import { getAssetAddress } from '../config/contracts';
import { SUPPORTED_ASSETS } from '../types';

export default function Earn() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const {
    data: accountData,
    isLoading: accountLoading,
    isError: accountError,
  } = useUserAccountData();
  const {
    data: marketResponse,
    isLoading: marketLoading,
    isError: marketError,
  } = useMarketStats();
  const {
    data: positions,
    isLoading: positionsLoading,
    isError: positionsError,
  } = useUserPositions();
  const { openDepositModal, openWithdrawModal } = useModalStore();

  const marketStats = marketResponse?.markets || [];

  // 只展示 API 返回且当前链已配置地址的市场。
  const earnAssets = useMemo(() => {
    return marketStats.flatMap((marketData) => {
      const asset = SUPPORTED_ASSETS.find((item) => item.symbol === marketData.symbol);
      if (!asset || !getAssetAddress(chainId, marketData.symbol)) return [];
      return [{ ...asset, ...marketData }];
    });
  }, [chainId, marketStats]);

  // 计算预估年收益和平均 APY
  const { estimatedYearlyEarnings, averageAPY } = useMemo(() => {
    if (accountError || marketError || positionsError || !accountData || !positions || earnAssets.length === 0) {
      return { estimatedYearlyEarnings: null, averageAPY: null };
    }

    // 计算加权平均 APY
    let weightedAPY = 0;
    let totalWeight = 0;

    positions.deposits.forEach(deposit => {
      const asset = earnAssets.find(a => a.symbol === deposit.symbol);
      if (asset) {
        const depositValue = parseFloat(deposit.valueUsd);
        const apy = parseFloat(asset.supplyAPY);
        weightedAPY += depositValue * apy;
        totalWeight += depositValue;
      }
    });

    if (totalWeight === 0) {
      return { estimatedYearlyEarnings: 0, averageAPY: 0 };
    }

    const avgAPY = weightedAPY / totalWeight;
    return {
      estimatedYearlyEarnings: (totalWeight * avgAPY) / 100,
      averageAPY: avgAPY,
    };
  }, [accountData, accountError, earnAssets, marketError, positions, positionsError]);

  // 格式化数字
  const formatUSD = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatSupply = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num === 0) return '$0';
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">连接钱包</h2>
          <p className="text-slate-400 mb-6">请先连接您的钱包以开始存款赚取收益</p>
        </div>
      </div>
    );
  }

  const isLoading = accountLoading || marketLoading || positionsLoading;
  const hasDataError = accountError || marketError || positionsError;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">存款</h1>
        <p className="text-slate-400 mt-1">存入资产赚取利息收益</p>
      </div>

      {hasDataError && (
        <div className="p-4 rounded-xl bg-danger-500/10 border border-danger-500/30 text-danger-300 text-sm">
          链上账户或市场数据不可用，收益估算和操作已停用。
        </div>
      )}

      {/* 存款概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-sm text-slate-400 mb-1">总存款价值</div>
          {isLoading ? (
            <div className="h-8 w-24 skeleton rounded" />
          ) : accountError || !accountData ? (
            <div className="text-2xl font-semibold text-slate-500">--</div>
          ) : (
            <div className="text-2xl font-semibold text-slate-100 tabular-nums">
              {formatUSD(accountData?.totalCollateralUSD || '0')}
            </div>
          )}
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-400 mb-1">预估年收益</div>
          {isLoading ? (
            <div className="h-8 w-24 skeleton rounded" />
          ) : estimatedYearlyEarnings == null ? (
            <div className="text-2xl font-semibold text-slate-500">--</div>
          ) : (
            <div className="text-2xl font-semibold text-success-400 tabular-nums">
              {formatUSD(estimatedYearlyEarnings)}
            </div>
          )}
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-400 mb-1">平均 APY</div>
          {isLoading ? (
            <div className="h-8 w-16 skeleton rounded" />
          ) : averageAPY == null ? (
            <div className="text-2xl font-semibold text-slate-500">--</div>
          ) : (
            <div className="text-2xl font-semibold text-success-400 tabular-nums">
              {averageAPY.toFixed(2)}%
            </div>
          )}
        </div>
      </div>

      {/* 我的存款 */}
      {positions?.deposits && positions.deposits.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-slate-700/50">
            <h2 className="font-semibold text-slate-100">我的存款</h2>
          </div>
          <div className="divide-y divide-slate-700/50">
            {positions.deposits.map((deposit, index) => {
              const asset = SUPPORTED_ASSETS.find(a => a.symbol === deposit.symbol);
              const marketData = marketStats.find(m => m.symbol === deposit.symbol);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl">
                      {asset?.icon || '🪙'}
                    </div>
                    <div>
                      <div className="font-medium text-slate-100">{deposit.symbol}</div>
                      <div className="text-sm text-slate-500">{formatUSD(deposit.valueUsd)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm text-slate-400">APY</div>
                      <div className="font-medium text-success-400">{marketData ? `${marketData.supplyAPY}%` : '--'}</div>
                    </div>
                    <button
                      onClick={() => openWithdrawModal(deposit.symbol)}
                      className="btn-secondary"
                    >
                      提取
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 可存款资产 */}
      <div className="card">
        <div className="p-4 border-b border-slate-700/50">
          <h2 className="font-semibold text-slate-100">可存款资产</h2>
        </div>
        <div className="divide-y divide-slate-700/50">
          {marketLoading ? (
            // 骨架屏
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 skeleton rounded-lg" />
                  <div>
                    <div className="h-5 w-16 skeleton rounded mb-1" />
                    <div className="h-4 w-24 skeleton rounded" />
                  </div>
                </div>
                <div className="h-8 w-32 skeleton rounded" />
              </div>
            ))
          ) : earnAssets.length === 0 ? (
            <div className="p-8 text-center text-slate-500">当前网络暂无已配置的存款市场</div>
          ) : (
            earnAssets.map(asset => (
              <div
                key={asset.symbol}
                className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl">
                    {asset.icon}
                  </div>
                  <div>
                    <div className="font-medium text-slate-100">{asset.symbol}</div>
                    <div className="text-sm text-slate-500">{asset.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-sm text-slate-400">存款 APY</div>
                    <div className="font-medium text-success-400">{asset.supplyAPY}%</div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-sm text-slate-400">总存款</div>
                    <div className="font-medium text-slate-100">{formatSupply(asset.totalSupply)}</div>
                  </div>
                  <div className="text-right hidden md:block">
                    <div className="text-sm text-slate-400">利用率</div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${Math.min(parseFloat(asset.utilizationRate), 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-400">{parseFloat(asset.utilizationRate).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openDepositModal(asset.symbol)}
                      disabled={hasDataError}
                      className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      存款
                    </button>
                    <button
                      onClick={() => openWithdrawModal(asset.symbol)}
                      disabled={hasDataError}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      提取
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 收益说明 */}
      <div className="card p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-info-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="font-medium text-slate-200">如何赚取收益？</div>
            <p className="text-sm text-slate-400 mt-1">
              当您存入资产后，它们会被提供给借款人使用。作为回报，您将按照浮动利率持续赚取利息。利率会根据市场供需自动调整。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
