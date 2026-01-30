import { memo, useState } from 'react';
import { useAccount } from 'wagmi';
import { useUserAccountData } from '../../hooks/useLendingPool';
import ConnectButton from './ConnectButton';

// 格式化美元金额
function formatUSD(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num) || num === 0) return '$0.00';
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

interface TopBarProps {
  sidebarCollapsed?: boolean;
}

export default memo(function TopBar({ sidebarCollapsed = false }: TopBarProps) {
  const { isConnected } = useAccount();
  const { data: accountData, isLoading } = useUserAccountData();
  const [showNotifications, setShowNotifications] = useState(false);

  // 计算净值
  const netWorth = accountData
    ? parseFloat(accountData.totalCollateralUSD) - parseFloat(accountData.totalDebtUSD)
    : 0;

  return (
    <header
      className={`fixed top-0 right-0 h-16 z-30 transition-all duration-300 ${
        sidebarCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* 背景 */}
      <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800/50" />

      {/* 内容 */}
      <div className="relative h-full px-6 flex items-center justify-between">
        {/* 左侧：搜索/全局资产 */}
        <div className="flex items-center gap-6">
          {/* 全局资产概览 */}
          {isConnected && (
            <div className="flex items-center gap-4">
              {/* 净资产 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">净资产</span>
                {isLoading ? (
                  <div className="h-5 w-16 skeleton rounded" />
                ) : (
                  <span className={`text-sm font-semibold tabular-nums ${netWorth >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                    {netWorth >= 0 ? '' : '-'}{formatUSD(Math.abs(netWorth).toString())}
                  </span>
                )}
              </div>

              {/* 分割线 */}
              <div className="w-px h-4 bg-slate-700" />

              {/* 健康因子 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">健康因子</span>
                {isLoading ? (
                  <div className="h-5 w-10 skeleton rounded" />
                ) : (
                  <HealthFactorBadge value={accountData?.healthFactor || '0'} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-3">
          {/* 网络状态 */}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
            </span>
            <span className="text-xs text-slate-400 font-medium">Sepolia</span>
          </div>

          {/* 通知按钮 */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* 通知点 */}
              <span className="absolute top-2 right-2 w-2 h-2 bg-danger-500 rounded-full" />
            </button>

            {/* 通知下拉 */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-xl border border-slate-700/50 shadow-xl z-50 animate-fade-in">
                  <div className="p-4 border-b border-slate-700/50">
                    <h3 className="font-semibold text-slate-100">通知</h3>
                  </div>
                  <div className="p-4 text-center text-slate-500 text-sm">
                    <svg className="w-10 h-10 mx-auto mb-2 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    暂无新通知
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 钱包连接 */}
          <ConnectButton />
        </div>
      </div>
    </header>
  );
});

// 健康因子徽章
function HealthFactorBadge({ value }: { value: string }) {
  const hf = parseFloat(value);

  let colorClass = 'text-success-400 bg-success-500/10 border-success-500/30';
  let displayValue = '∞';

  if (hf > 0) {
    displayValue = hf.toFixed(2);
    if (hf < 1.15) {
      colorClass = 'text-danger-400 bg-danger-500/10 border-danger-500/30';
    } else if (hf < 1.5) {
      colorClass = 'text-warning-400 bg-warning-500/10 border-warning-500/30';
    } else if (hf < 2) {
      colorClass = 'text-info-400 bg-info-500/10 border-info-500/30';
    }
  }

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold tabular-nums border ${colorClass}`}>
      {displayValue}
    </span>
  );
}
