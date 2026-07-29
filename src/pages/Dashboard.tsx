import { useState, useMemo, memo } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { Link } from 'react-router-dom';
import { useModalStore } from '../store/useStore';
import { useUserAccountData } from '../hooks/useLendingPool';
import { useCreditInfo, usePlatformStats, useMarketStats } from '../hooks/useApiQueries';
import type { PlatformStats, MarketStatsItem } from '../types';
import { SUPPORTED_ASSETS } from '../types';

// 格式化函数
function formatUSD(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return '$0.00';
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

function formatHealthFactor(hf: number): string {
  if (hf === 0) return '∞';
  return hf.toFixed(2);
}

function getHealthFactorColor(hf: number): string {
  if (hf === 0) return 'text-success-400';
  if (hf >= 2) return 'text-success-400';
  if (hf >= 1.5) return 'text-info-400';
  if (hf >= 1.15) return 'text-warning-400';
  return 'text-danger-400';
}

// 获取资产图标
const assetIconMap = new Map<string, string>();
SUPPORTED_ASSETS.forEach(a => assetIconMap.set(a.symbol, a.icon));
function getAssetIcon(symbol: string): string {
  return assetIconMap.get(symbol) || '💰';
}

// 信用等级样式
const TIER_STYLES: Record<string, { color: string; bgColor: string }> = {
  S: { color: 'text-accent-400', bgColor: 'bg-accent-500/10' },
  A: { color: 'text-success-400', bgColor: 'bg-success-500/10' },
  B: { color: 'text-info-400', bgColor: 'bg-info-500/10' },
  C: { color: 'text-warning-400', bgColor: 'bg-warning-500/10' },
  D: { color: 'text-danger-400', bgColor: 'bg-danger-500/10' },
};

// 账户概览卡片
const AccountOverview = memo(function AccountOverview() {
  const { data: accountData, isLoading, isError: isAccountError } = useUserAccountData();
  const { data: creditInfo, isLoading: isLoadingCredit, isError: isCreditError } = useCreditInfo();

  if (isAccountError || isCreditError) {
    return (
      <div className="card p-5 text-danger-300 border border-danger-500/30 col-span-full">
        链上账户或信用数据不可用，未使用零值或模拟金额代替。
      </div>
    );
  }

  const tierStyle = TIER_STYLES[creditInfo?.tier || 'C'] || TIER_STYLES.C;
  const healthFactor = parseFloat(accountData?.healthFactor || '0');
  const totalCollateral = parseFloat(accountData?.totalCollateralUSD || '0');
  const totalDebt = parseFloat(accountData?.totalDebtUSD || '0');
  const netWorth = totalCollateral - totalDebt;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 净资产 */}
      <div className="card p-5">
        <div className="text-sm text-slate-400 mb-1">净资产</div>
        {isLoading ? (
          <div className="h-8 w-24 skeleton rounded" />
        ) : (
          <div className={`text-2xl font-semibold tabular-nums ${netWorth >= 0 ? 'text-slate-100' : 'text-danger-400'}`}>
            {formatUSD(netWorth)}
          </div>
        )}
      </div>

      {/* 总存款 */}
      <div className="card p-5">
        <div className="text-sm text-slate-400 mb-1">总存款</div>
        {isLoading ? (
          <div className="h-8 w-24 skeleton rounded" />
        ) : (
          <div className="text-2xl font-semibold text-slate-100 tabular-nums">
            {formatUSD(totalCollateral)}
          </div>
        )}
      </div>

      {/* 总借款 */}
      <div className="card p-5">
        <div className="text-sm text-slate-400 mb-1">总借款</div>
        {isLoading ? (
          <div className="h-8 w-24 skeleton rounded" />
        ) : (
          <div className="text-2xl font-semibold text-danger-400 tabular-nums">
            {formatUSD(totalDebt)}
          </div>
        )}
      </div>

      {/* 健康因子 */}
      <div className="card p-5">
        <div className="text-sm text-slate-400 mb-1">健康因子</div>
        {isLoading ? (
          <div className="h-8 w-16 skeleton rounded" />
        ) : (
          <div className={`text-2xl font-semibold tabular-nums ${getHealthFactorColor(healthFactor)}`}>
            {formatHealthFactor(healthFactor)}
          </div>
        )}
      </div>

      {/* 信用等级 */}
      <div className="card p-5">
        <div className="text-sm text-slate-400 mb-1">信用等级</div>
        {isLoadingCredit ? (
          <div className="h-8 w-16 skeleton rounded" />
        ) : (
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${tierStyle.color}`}>
              {creditInfo?.tier || 'C'}
            </span>
            <span className="text-slate-500 text-sm">
              {creditInfo?.score || 500}分
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

// 快速操作
const QuickActions = memo(function QuickActions() {
  const { openDepositModal, openBorrowModal } = useModalStore();

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-slate-100 mb-4">快速操作</h3>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => openDepositModal('USDT')}
          className="flex items-center gap-3 p-4 rounded-xl bg-success-500/10 border border-success-500/20 hover:border-success-500/40 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-success-500/20 flex items-center justify-center group-hover:bg-success-500/30 transition-colors">
            <svg className="w-5 h-5 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div className="text-left">
            <div className="font-medium text-slate-100">存款</div>
            <div className="text-xs text-slate-500">存入资产赚取收益</div>
          </div>
        </button>

        <button
          onClick={() => openBorrowModal('USDT')}
          className="flex items-center gap-3 p-4 rounded-xl bg-primary-500/10 border border-primary-500/20 hover:border-primary-500/40 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/30 transition-colors">
            <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-left">
            <div className="font-medium text-slate-100">借款</div>
            <div className="text-xs text-slate-500">使用抵押品借款</div>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <Link
          to="/markets"
          className="flex items-center justify-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 text-slate-300 hover:text-slate-100 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          查看市场
        </Link>
        <Link
          to="/credit"
          className="flex items-center justify-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 text-slate-300 hover:text-slate-100 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          信用中心
        </Link>
      </div>
    </div>
  );
});

// 平台统计
const PlatformStatsDisplay = memo(function PlatformStatsDisplay({ stats, isLoading, isError }: { stats: PlatformStats | null; isLoading: boolean; isError: boolean }) {
  const items = useMemo(() => [
    { label: '总锁仓价值', value: stats ? formatUSD(stats.totalValueLocked) : '--', icon: '🔒' },
    { label: '总存款', value: stats ? formatUSD(stats.totalDeposits) : '--', icon: '💰' },
    { label: '总借款', value: stats ? formatUSD(stats.totalBorrows) : '--', icon: '📊' },
    { label: '活跃用户', value: stats ? stats.activeUsers.toLocaleString() : '--', icon: '👥' },
  ], [stats]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <div key={index} className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm text-slate-400">{item.label}</span>
          </div>
          {isLoading ? (
            <div className="h-7 w-20 skeleton rounded" />
          ) : isError ? (
            <div className="text-xl font-semibold text-slate-500">--</div>
          ) : (
            <div className="text-xl font-semibold text-slate-100 tabular-nums">
              {item.value}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

// 市场列表
const MarketList = memo(function MarketList({ markets, isLoading, isError }: { markets: MarketStatsItem[]; isLoading: boolean; isError: boolean }) {
  const { openDepositModal, openBorrowModal } = useModalStore();

  return (
    <div className="card">
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <h3 className="font-semibold text-slate-100">热门市场</h3>
        <Link to="/markets" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
          查看全部
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      <div className="divide-y divide-slate-700/50">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 skeleton rounded-lg" />
                <div>
                  <div className="h-5 w-16 skeleton rounded mb-1" />
                  <div className="h-4 w-24 skeleton rounded" />
                </div>
              </div>
              <div className="h-8 w-20 skeleton rounded-lg" />
            </div>
          ))
        ) : isError ? (
          <div className="p-8 text-center text-danger-300">市场数据不可用</div>
        ) : markets.length > 0 ? (
          markets.slice(0, 4).map((market) => (
            <div key={market.symbol} className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl">
                  {getAssetIcon(market.symbol)}
                </div>
                <div>
                  <div className="font-medium text-slate-100">{market.symbol}</div>
                  <div className="text-sm text-slate-500">{market.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-slate-500">存款 APY</div>
                  <div className="text-success-400 font-medium tabular-nums">{market.supplyAPY}%</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openDepositModal(market.symbol)}
                    className="px-3 py-1.5 text-sm rounded-lg bg-success-500/10 text-success-400 hover:bg-success-500/20 border border-success-500/20 transition-colors"
                  >
                    存款
                  </button>
                  <button
                    onClick={() => openBorrowModal(market.symbol)}
                    className="px-3 py-1.5 text-sm rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 border border-primary-500/20 transition-colors"
                  >
                    借款
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-500">暂无市场数据</div>
        )}
      </div>
    </div>
  );
});

// 未连接引导
function ConnectWalletGuide({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="card p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center">
        <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-slate-100 mb-2">连接您的钱包</h2>
      <p className="text-slate-400 mb-6 max-w-sm mx-auto">
        连接钱包后，您可以存款赚取收益、借款获得资金，并建立您的链上信用评分
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={onConnect} className="btn-primary px-6">
          连接钱包
        </button>
        <Link to="/markets" className="btn-secondary px-6">
          浏览市场
        </Link>
      </div>
    </div>
  );
}

// 功能卡片
const FeatureCards = memo(function FeatureCards() {
  const features = [
    { icon: '💰', title: '存款赚取收益', desc: '存入您的资产，自动赚取利息收益' },
    { icon: '🛡️', title: '信用增强借款', desc: '建立链上信用评分，获得更高的LTV' },
    { icon: '⚡', title: '安全透明', desc: '智能合约保障资金安全，链上可查' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {features.map((feature, index) => (
        <div key={index} className="card p-5">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl mb-3">
            {feature.icon}
          </div>
          <h3 className="font-semibold text-slate-100 mb-1">{feature.title}</h3>
          <p className="text-sm text-slate-400">{feature.desc}</p>
        </div>
      ))}
    </div>
  );
});

export default function Dashboard() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [showWalletModal, setShowWalletModal] = useState(false);

  // 使用 React Query hooks 加载公开数据
  const { data: platformStats, isLoading: isLoadingStats, isError: isStatsError } = usePlatformStats();
  const { data: marketStatsData, isLoading: isLoadingMarkets, isError: isMarketsError } = useMarketStats();
  const marketStats = marketStatsData?.markets || [];

  const hasInjectedWallet = typeof window !== 'undefined' && window.ethereum;

  const handleConnect = () => setShowWalletModal(true);

  const handleSelectWallet = (connector: typeof connectors[number]) => {
    if ((connector.name === 'Injected' || connector.name.toLowerCase().includes('metamask')) && !hasInjectedWallet) {
      window.open('https://metamask.io/download/', '_blank');
      setShowWalletModal(false);
      return;
    }
    setShowWalletModal(false);
    connect({ connector });
  };

  return (
    <div className="space-y-6">
      {/* 欢迎语 */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">
          {isConnected ? '欢迎回来' : 'CreditLink'}
        </h1>
        <p className="text-slate-400 mt-1">
          {isConnected ? '您的链上信用正在为您创造价值' : '基于链上信用的去中心化借贷协议'}
        </p>
      </div>

      {/* 平台统计 */}
      <PlatformStatsDisplay stats={platformStats || null} isLoading={isLoadingStats} isError={isStatsError} />

      {isConnected ? (
        <>
          {/* 账户概览 */}
          <AccountOverview />

          {/* 快速操作和市场 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <QuickActions />
            </div>
            <div className="lg:col-span-2">
              <MarketList markets={marketStats} isLoading={isLoadingMarkets} isError={isMarketsError} />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* 未连接引导 */}
          <ConnectWalletGuide onConnect={handleConnect} />

          {/* 功能介绍 */}
          <FeatureCards />

          {/* 市场概览 */}
          <MarketList markets={marketStats} isLoading={isLoadingMarkets} isError={isMarketsError} />
        </>
      )}

      {/* 钱包选择模态框 */}
      {showWalletModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowWalletModal(false)} />
          <div className="modal-content p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-100">选择钱包</h3>
              <button
                onClick={() => setShowWalletModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {connectors.map((connector) => {
                const isInjected = connector.name === 'Injected' || connector.name.toLowerCase().includes('metamask');
                const isUnavailable = isInjected && !hasInjectedWallet;

                return (
                  <button
                    key={connector.uid}
                    onClick={() => handleSelectWallet(connector)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      isUnavailable
                        ? 'bg-slate-800/30 border-slate-700/30 hover:border-warning-500/50'
                        : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/50 hover:border-primary-500/50'
                    }`}
                  >
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                      <svg className={`w-8 h-8 ${isUnavailable ? 'text-slate-500' : 'text-primary-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`font-medium ${isUnavailable ? 'text-slate-400' : 'text-slate-100'}`}>
                        {connector.name === 'Injected' ? 'MetaMask' : connector.name}
                        {isUnavailable && <span className="ml-2 text-xs text-warning-500">(未安装)</span>}
                      </div>
                      <div className="text-sm text-slate-500">
                        {isUnavailable ? '点击前往安装' : '使用浏览器扩展连接'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
