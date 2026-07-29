import { useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useModalStore } from '../store/useStore';
import { SUPPORTED_ASSETS } from '../types';
import type { MarketStatsItem } from '../types';
import { usePlatformStats, useMarketStats } from '../hooks/useApiQueries';
import { getAssetAddress } from '../config/contracts';
import InterestRateCurve from '../components/charts/InterestRateCurve';

// 格式化简单数字
function formatSimpleNumber(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num) || num === 0) return '$0';
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

// 增强版市场行组件 - 使用后端API数据
function MarketRowEnhanced({
  asset,
  marketData
}: {
  asset: typeof SUPPORTED_ASSETS[number];
  marketData: MarketStatsItem;
}) {
  const { openDepositModal, openBorrowModal } = useModalStore();

  const { totalSupply, totalBorrow, supplyAPY, borrowAPR, utilizationRate } = marketData;

  return (
    <tr className="border-b border-primary-500/10 hover:bg-gradient-to-r hover:from-primary-500/5 hover:to-cyan-500/5 transition-all duration-300 group">
      <td className="py-5 px-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dark-100 to-dark-300 border border-gray-700/50 flex items-center justify-center text-2xl group-hover:border-primary-500/50 group-hover:shadow-glow transition-all duration-300">
              {asset.icon}
            </div>
            {/* 状态指示灯 */}
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-dark-300 animate-pulse" />
          </div>
          <div>
            <div className="font-semibold text-white group-hover:text-gradient transition-all duration-300">{asset.symbol}</div>
            <div className="text-sm text-gray-500">{asset.name}</div>
          </div>
        </div>
      </td>
      <td className="py-5 px-6">
        <div>
          <div className="font-medium text-white">{formatSimpleNumber(totalSupply)}</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-20 h-2 bg-dark-100 rounded-full overflow-hidden border border-gray-700/30">
              <div
                className="h-full bg-gradient-to-r from-primary-500 via-violet-500 to-cyan-500 rounded-full relative"
                style={{ width: `${Math.min(parseFloat(utilizationRate), 100)}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
              </div>
            </div>
            <span className="text-xs text-gray-400 font-medium">{parseFloat(utilizationRate).toFixed(1)}%</span>
          </div>
        </div>
      </td>
      <td className="py-5 px-6">
        <div className="flex items-center gap-2">
          <span className="font-bold text-emerald-400 text-lg">{supplyAPY}%</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </td>
      <td className="py-5 px-6">
        <span className="font-medium text-white">{formatSimpleNumber(totalBorrow)}</span>
      </td>
      <td className="py-5 px-6">
        <div className="flex items-center gap-2">
          <span className="font-bold text-amber-400 text-lg">{borrowAPR}%</span>
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        </div>
      </td>
      <td className="py-5 px-6">
        <div className="flex gap-2">
          <button
            onClick={() => openDepositModal(asset.symbol)}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 hover:border-emerald-400 hover:shadow-glow-green transition-all duration-300 hover:scale-105 active:scale-95"
          >
            存款
          </button>
          <button
            onClick={() => openBorrowModal(asset.symbol)}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-violet-500/20 text-violet-400 border border-violet-500/30 hover:bg-violet-500/30 hover:border-violet-400 hover:shadow-glow transition-all duration-300 hover:scale-105 active:scale-95"
          >
            借款
          </button>
        </div>
      </td>
    </tr>
  );
}

// 格式化美元金额
function formatUSD(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return '$0';
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

export default function Markets() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  // 使用 React Query hooks 加载数据
  const {
    data: platformStats,
    isLoading: isLoadingStats,
    isError: isPlatformError,
  } = usePlatformStats();
  const {
    data: marketStatsResponse,
    isLoading: isLoadingMarkets,
    isError: isMarketError,
  } = useMarketStats();
  const marketStats = marketStatsResponse?.markets || [];
  const configuredMarkets = useMemo(() => marketStats.flatMap((marketData) => {
    const asset = SUPPORTED_ASSETS.find((item) => item.symbol === marketData.symbol);
    if (!asset || !getAssetAddress(chainId, marketData.symbol)) return [];
    return [{ asset, marketData }];
  }), [chainId, marketStats]);

  // 计算利用率
  const utilizationRate = useMemo(() => {
    if (!platformStats) return null;
    const deposits = parseFloat(platformStats.totalDeposits);
    const borrows = parseFloat(platformStats.totalBorrows);
    if (deposits === 0) return '0';
    return ((borrows / deposits) * 100).toFixed(1);
  }, [platformStats]);

  const stats = useMemo(() => [
    {
      label: '总存款',
      value: platformStats ? formatUSD(platformStats.totalDeposits) : '--',
      gradient: 'from-emerald-500 to-teal-500',
      icon: '💰',
      isLoading: isLoadingStats
    },
    {
      label: '总借款',
      value: platformStats ? formatUSD(platformStats.totalBorrows) : '--',
      gradient: 'from-violet-500 to-purple-500',
      icon: '📊',
      isLoading: isLoadingStats
    },
    {
      label: '平均利用率',
      value: utilizationRate == null ? '--' : `${utilizationRate}%`,
      gradient: 'from-cyan-500 to-blue-500',
      icon: '⚡',
      isLoading: isLoadingStats
    },
  ], [platformStats, utilizationRate, isLoadingStats]);

  return (
    <div className="space-y-8">
      {/* 页面标题 - 增强版 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/20 rounded-full border border-primary-500/30 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
            </span>
            <span className="text-xs text-primary-300 font-medium">
              {isPlatformError || isMarketError ? '数据不可用' : isLoadingMarkets ? '数据加载中' : '实时数据'}
            </span>
          </div>
          <h1 className="text-4xl font-bold">
            <span className="text-gradient">借贷市场</span>
          </h1>
          <p className="text-gray-400 mt-2">探索所有可用的 DeFi 借贷市场，获取最佳收益</p>
        </div>
        {!isConnected && (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl animate-fade-in">
            <svg className="w-5 h-5 text-amber-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-amber-400 font-medium">请连接钱包以进行操作</span>
          </div>
        )}
      </div>

      {(isPlatformError || isMarketError) && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          预言机或市场 API 数据不可用，已停用市场操作。
        </div>
      )}

      {/* 市场统计 - 增强版 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="card-3d animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="card-3d-inner glass-card-hover p-6 relative overflow-hidden">
              {/* 背景渐变 */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-10`} />
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl animate-float" style={{ animationDelay: `${index * 200}ms` }}>{stat.icon}</span>
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${stat.gradient} animate-pulse`} />
                </div>
                <div className="text-sm text-gray-400 mb-2 font-medium">{stat.label}</div>
                {stat.isLoading ? (
                  <div className="h-10 w-28 skeleton" />
                ) : (
                  <div className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 市场列表 - 增强版 */}
      <div className="glass-card overflow-hidden relative">
        {/* 顶部装饰线 */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-dark-400/80 to-dark-300/80 border-b border-primary-500/20">
                <th className="text-left px-6 py-5 text-sm font-bold text-gray-300 uppercase tracking-wider">资产</th>
                <th className="text-left px-6 py-5 text-sm font-bold text-gray-300 uppercase tracking-wider">总存款 / 利用率</th>
                <th className="text-left px-6 py-5 text-sm font-bold text-gray-300 uppercase tracking-wider">
                  <span className="flex items-center gap-2">
                    存款 APY
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </span>
                </th>
                <th className="text-left px-6 py-5 text-sm font-bold text-gray-300 uppercase tracking-wider">总借款</th>
                <th className="text-left px-6 py-5 text-sm font-bold text-gray-300 uppercase tracking-wider">
                  <span className="flex items-center gap-2">
                    借款 APR
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  </span>
                </th>
                <th className="text-left px-6 py-5 text-sm font-bold text-gray-300 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingMarkets ? (
                // 骨架屏
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="border-b border-primary-500/10">
                    <td className="py-5 px-6"><div className="skeleton h-12 w-32" /></td>
                    <td className="py-5 px-6"><div className="skeleton h-8 w-24" /></td>
                    <td className="py-5 px-6"><div className="skeleton h-6 w-16" /></td>
                    <td className="py-5 px-6"><div className="skeleton h-6 w-20" /></td>
                    <td className="py-5 px-6"><div className="skeleton h-6 w-16" /></td>
                    <td className="py-5 px-6"><div className="skeleton h-10 w-32" /></td>
                  </tr>
                ))
              ) : configuredMarkets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">当前网络暂无已配置的市场数据</td>
                </tr>
              ) : (
                configuredMarkets.map(({ asset, marketData }) => (
                  <MarketRowEnhanced
                    key={asset.symbol}
                    asset={asset}
                    marketData={marketData}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 利率模型说明 - 增强版 */}
      <div className="glow-border-card">
        <div className="glass-card p-8 relative overflow-hidden">
          {/* 背景装饰 */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl" />

          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 relative z-10">
            <div className="w-1.5 h-8 bg-gradient-to-b from-primary-500 via-violet-500 to-cyan-500 rounded-full animate-pulse" />
            <span className="text-gradient">利率模型</span>
            <span className="text-gray-400 font-normal text-lg">(Kink Model)</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
            {/* 左侧：交互式利率曲线图 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                利率曲线 (移动鼠标查看详情)
              </h3>
              <div className="p-4 rounded-2xl bg-dark-100/50 border border-gray-700/50">
                <InterestRateCurve
                  baseRate={2}
                  optimalUtilization={80}
                  slope1={4}
                  slope2={75}
                  currentUtilization={utilizationRate == null ? 0 : parseFloat(utilizationRate)}
                  creditDiscount={0}
                />
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary-500/10 to-cyan-500/10 border border-primary-500/30 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-300">
                    信用等级越高，借款利率越低。<span className="text-gradient font-bold">S 级用户</span>可享受最多 <span className="text-cyan-400 font-bold text-lg">20%</span> 的利率折扣！
                  </p>
                </div>
              </div>
            </div>

            {/* 右侧：参数说明 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                模型参数
              </h3>
              <div className="space-y-3">
                {[
                  { label: '基础利率', value: '2%', color: 'from-gray-400 to-gray-500', icon: '📐', desc: '最低借款利率' },
                  { label: '最优利用率', value: '80%', color: 'from-cyan-400 to-blue-500', icon: '🎯', desc: '利率转折点' },
                  { label: '斜率1', value: '4%', color: 'from-emerald-400 to-green-500', icon: '📈', desc: '利用率 < 80% 时' },
                  { label: '斜率2', value: '75%', color: 'from-amber-400 to-orange-500', icon: '🚀', desc: '利用率 > 80% 时' },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl bg-dark-100/50 border border-gray-700/50 hover:border-primary-500/30 transition-all duration-300 group animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors block">{item.label}</span>
                        <span className="text-xs text-gray-500">{item.desc}</span>
                      </div>
                    </div>
                    <span className={`font-bold text-lg bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* 工作原理说明 */}
              <div className="p-4 rounded-xl bg-dark-100/30 border border-gray-800/50 mt-4">
                <p className="text-sm text-gray-400 leading-relaxed">
                  CreditLink 使用<span className="text-primary-400 font-medium">双斜率利率模型</span>。当资金利用率低于最优值时，利率缓慢上升；
                  当利用率超过最优值时，利率快速上升，以激励还款并保持流动性。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
