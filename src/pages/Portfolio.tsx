import { useAccount } from 'wagmi';
import { useUserAccountData } from '../hooks/useLendingPool';
import { useModalStore } from '../store/useStore';
import { useUserPositions, useUserActivities } from '../hooks/useApiQueries';
import CreditScoreCard from '../components/credit/CreditScoreCard';
import HealthFactorGauge from '../components/charts/HealthFactorGauge';

// 格式化美元金额
function formatUSD(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

// 格式化日期
function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp * 1000));
}

// 操作类型映射
const actionTypeMap: Record<string, { label: string; color: string; bgColor: string }> = {
  DEPOSIT: { label: '存款', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  WITHDRAW: { label: '提款', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  BORROW: { label: '借款', color: 'text-violet-400', bgColor: 'bg-violet-500/20' },
  REPAY: { label: '还款', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  LIQUIDATION: { label: '清算', color: 'text-rose-400', bgColor: 'bg-rose-500/20' },
};

// 资产图标映射
const assetIcons: Record<string, string> = {
  USDT: '💵',
  USDC: '💲',
  ETH: '⟠',
  WETH: '⟠',
  WBTC: '₿',
};

// 持仓卡片组件
function PositionCard({
  title,
  items,
  emptyText,
  type,
  icon,
}: {
  title: string;
  items: Array<{ asset: string; symbol: string; amount: string; valueUsd: string }>;
  emptyText: string;
  type: 'supply' | 'borrow';
  icon: React.ReactNode;
}) {
  const { openWithdrawModal, openRepayModal } = useModalStore();

  const colorClass = type === 'supply'
    ? { border: 'border-emerald-500/20', bg: 'from-emerald-500/10', text: 'text-emerald-400', btn: 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30' }
    : { border: 'border-violet-500/20', bg: 'from-violet-500/10', text: 'text-violet-400', btn: 'bg-violet-500/20 hover:bg-violet-500/30 border-violet-500/30' };

  return (
    <div className={`glass-card overflow-hidden border ${colorClass.border}`}>
      <div className={`p-6 bg-gradient-to-r ${colorClass.bg} to-transparent border-b ${colorClass.border}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${colorClass.text} bg-dark-300/50 flex items-center justify-center`}>
            {icon}
          </div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
      </div>

      <div className="p-6">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-500">{emptyText}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-xl bg-dark-100/50 border border-gray-800/50 hover:border-primary-500/20 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dark-100 to-dark-300 border border-gray-700/50 flex items-center justify-center text-2xl">
                    {assetIcons[item.symbol] || '🪙'}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{item.symbol || '未知资产'}</div>
                    <div className="text-sm text-gray-400">
                      {parseFloat(item.amount).toFixed(4)}
                    </div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <div className="font-semibold text-white">{formatUSD(item.valueUsd)}</div>
                  </div>
                  <button
                    onClick={() =>
                      type === 'supply'
                        ? openWithdrawModal(item.symbol || 'USDT')
                        : openRepayModal(item.symbol || 'USDT')
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${colorClass.text} ${colorClass.btn} border transition-all`}
                  >
                    {type === 'supply' ? '提款' : '还款'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 统计卡片组件 - 增强版
function StatCard({
  label,
  value,
  color = 'white',
  subValue,
  icon,
  gradient,
  index = 0,
}: {
  label: string;
  value: string;
  color?: string;
  subValue?: React.ReactNode;
  icon?: string;
  gradient?: string;
  index?: number;
}) {
  const colorClasses: Record<string, string> = {
    white: 'text-white',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
  };

  const gradientClasses: Record<string, string> = {
    white: 'from-gray-500/10 to-gray-600/5',
    emerald: 'from-emerald-500/15 to-teal-500/5',
    amber: 'from-amber-500/15 to-orange-500/5',
    rose: 'from-rose-500/15 to-red-500/5',
  };

  return (
    <div
      className="card-3d animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="card-3d-inner glass-card-hover p-6 relative overflow-hidden">
        {/* 背景渐变 */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient || gradientClasses[color] || gradientClasses.white}`} />
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-400 font-medium">{label}</div>
            {icon && <span className="text-2xl animate-float" style={{ animationDelay: `${index * 150}ms` }}>{icon}</span>}
          </div>
          <div className={`text-2xl md:text-3xl font-bold ${colorClasses[color] || colorClasses.white}`}>
            {value}
          </div>
          {subValue}
        </div>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const { isConnected, address } = useAccount();
  const {
    data: accountData,
    isLoading: accountLoading,
    isError: accountError,
  } = useUserAccountData();
  const { data: positions, isError: positionsError } = useUserPositions();
  const {
    data: activities = [],
    isLoading: activitiesLoading,
    isError: activitiesError,
  } = useUserActivities();

  // 未连接钱包 - 增强版
  if (!isConnected) {
    return (
      <div className="space-y-8">
        {/* 页面标题 - 增强版 */}
        <div className="animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/20 rounded-full border border-violet-500/30 mb-3">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs text-violet-300 font-medium">资产管理</span>
          </div>
          <h1 className="text-4xl font-bold">
            <span className="text-gradient">我的持仓</span>
          </h1>
          <p className="text-gray-400 mt-2">管理您的存款和借款，追踪投资组合表现</p>
        </div>

        {/* 未连接引导 - 超级增强版 */}
        <div className="glow-border-card animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="glass-card p-12 md:p-16 text-center relative overflow-hidden">
            {/* 背景装饰 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-radial from-primary-500/20 via-primary-500/5 to-transparent blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-violet-500/10 rounded-full blur-3xl" />

            {/* 能量波纹 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
              <div className="energy-ripple" />
            </div>

            <div className="relative z-10">
              {/* 动画图标 */}
              <div className="w-28 h-28 mx-auto mb-8 relative">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-500/30 to-cyan-500/30 border border-primary-500/30 animate-morph" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-14 h-14 text-primary-400 animate-float" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                {/* 脉冲环 */}
                <div className="absolute inset-0 rounded-3xl animate-ping-slow opacity-20 bg-primary-500" />
              </div>

              <h2 className="text-3xl font-bold mb-4">
                <span className="text-gradient-animated">连接钱包查看持仓</span>
              </h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                连接您的钱包以查看和管理您的 DeFi 资产，追踪存款收益和借款状况
              </p>

              {/* 功能预览 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                {[
                  { icon: '💰', title: '存款管理', desc: '查看存款收益' },
                  { icon: '📊', title: '借款追踪', desc: '监控借款状态' },
                  { icon: '⭐', title: '信用评分', desc: '提升借款额度' },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-dark-100/50 border border-gray-700/50 animate-fade-in-up"
                    style={{ animationDelay: `${(index + 2) * 100}ms` }}
                  >
                    <span className="text-2xl mb-2 block">{item.icon}</span>
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                ))}
              </div>

              <div className="text-sm text-gray-500">
                支持 MetaMask、WalletConnect 等主流钱包
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 计算健康因子状态
  const healthFactor = parseFloat(accountData?.healthFactor || '0');
  const healthStatus = healthFactor === 0
    ? { label: '无借款', color: 'white', value: '∞' }
    : healthFactor >= 1.5
      ? { label: '健康', color: 'emerald', value: healthFactor.toFixed(2) }
      : healthFactor >= 1.15
        ? { label: '警告', color: 'amber', value: healthFactor.toFixed(2) }
        : { label: '危险', color: 'rose', value: healthFactor.toFixed(2) };

  return (
    <div className="space-y-8">
      {/* 页面标题 - 增强版 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/20 rounded-full border border-violet-500/30 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs text-violet-300 font-medium">资产管理</span>
          </div>
          <h1 className="text-4xl font-bold">
            <span className="text-gradient">我的持仓</span>
          </h1>
          <p className="text-gray-400 mt-2">管理您的存款和借款，追踪投资组合表现</p>
        </div>
        <div className="text-sm text-gray-500 animate-fade-in">
          钱包: <span className="text-primary-400 font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
        </div>
      </div>

      {(accountError || positionsError || activitiesError) && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          链上账户或持仓数据不可用，未使用零值或模拟金额代替。
        </div>
      )}

      {/* 账户概览 - 增强版 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="总资产价值"
          value={accountLoading ? '...' : accountError || !accountData ? '--' : formatUSD(accountData.totalCollateralUSD)}
          color="emerald"
          icon="💎"
          index={0}
        />
        <StatCard
          label="总借款"
          value={accountLoading ? '...' : accountError || !accountData ? '--' : formatUSD(accountData.totalDebtUSD)}
          color="amber"
          icon="📤"
          index={1}
        />
        <StatCard
          label="净资产"
          value={accountLoading ? '...' : accountError || !accountData ? '--' : formatUSD(
            (parseFloat(accountData.totalCollateralUSD) - parseFloat(accountData.totalDebtUSD)).toString()
          )}
          icon="💰"
          index={2}
        />
        <StatCard
          label="健康因子"
          value={accountLoading ? '...' : accountError || !accountData ? '--' : healthStatus.value}
          color={healthStatus.color}
          icon={healthStatus.color === 'emerald' ? '✅' : healthStatus.color === 'amber' ? '⚠️' : '🚨'}
          index={3}
          subValue={
            <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-${healthStatus.color}-500/20 text-${healthStatus.color}-400 border border-${healthStatus.color}-500/30`}>
              <span className={`w-1.5 h-1.5 rounded-full bg-${healthStatus.color}-400 animate-pulse`} />
              {healthStatus.label}
            </div>
          }
        />
      </div>

      {/* 健康因子和信用评分 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 健康因子仪表盘 */}
        <div className="glass-card-hover p-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl" />
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
            <span className="w-1 h-5 bg-gradient-to-b from-primary-500 to-cyan-500 rounded-full" />
            健康因子
          </h3>
          <div className="relative z-10 flex justify-center">
            {accountError || !accountData ? (
              <div className="py-16 text-gray-500">健康因子不可用</div>
            ) : (
              <HealthFactorGauge
                healthFactor={healthFactor}
                size="md"
                showLabels={true}
              />
            )}
          </div>
          {healthFactor > 0 && healthFactor < 1.5 && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 relative z-10">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs text-amber-300">
                  您的健康因子较低，建议还款或增加抵押品以降低清算风险
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 信用评分卡片 */}
        <div className="lg:col-span-2">
          <CreditScoreCard compact />
        </div>
      </div>

      {/* 持仓列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PositionCard
          title="已存款资产"
          items={positions?.deposits || []}
          emptyText="暂无存款资产"
          type="supply"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        />
        <PositionCard
          title="已借款资产"
          items={positions?.borrows || []}
          emptyText="暂无借款"
          type="borrow"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
      </div>

      {/* 交易历史 */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-primary-500/10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-primary-500 to-cyan-500 rounded-full" />
            交易历史
          </h2>
        </div>

        <div className="p-6">
          {activitiesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500">暂无交易记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-800/50">
                    <th className="pb-4 font-semibold text-gray-400 text-sm">类型</th>
                    <th className="pb-4 font-semibold text-gray-400 text-sm">资产</th>
                    <th className="pb-4 font-semibold text-gray-400 text-sm">金额</th>
                    <th className="pb-4 font-semibold text-gray-400 text-sm">时间</th>
                    <th className="pb-4 font-semibold text-gray-400 text-sm">交易</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity, index) => {
                    const actionInfo = actionTypeMap[activity.actionType] || {
                      label: activity.actionType,
                      color: 'text-gray-400',
                      bgColor: 'bg-gray-500/20',
                    };
                    return (
                      <tr key={index} className="border-b border-gray-800/30 hover:bg-primary-500/5 transition-colors">
                        <td className="py-4">
                          <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-medium ${actionInfo.bgColor} ${actionInfo.color}`}>
                            {actionInfo.label}
                          </span>
                        </td>
                        <td className="py-4 font-medium text-white">{activity.asset.slice(0, 8)}...</td>
                        <td className="py-4 font-medium text-white">{parseFloat(activity.amount).toFixed(4)}</td>
                        <td className="py-4 text-gray-400 text-sm">
                          {formatDate(activity.timestamp)}
                        </td>
                        <td className="py-4">
                          <a
                            href={`https://sepolia.etherscan.io/tx/${activity.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300 text-sm font-medium"
                          >
                            查看
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
