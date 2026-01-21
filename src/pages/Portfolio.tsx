import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { api } from '../services/api';
import { useUserAccountData } from '../hooks/useLendingPool';
import { useModalStore, useUserStore } from '../store/useStore';
import CreditScoreCard from '../components/credit/CreditScoreCard';
import type { ActivityRecord } from '../types';

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

// 统计卡片组件
function StatCard({
  label,
  value,
  color = 'white',
  subValue,
}: {
  label: string;
  value: string;
  color?: string;
  subValue?: React.ReactNode;
}) {
  const colorClasses: Record<string, string> = {
    white: 'text-white',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
  };

  return (
    <div className="glass-card-hover p-6">
      <div className="text-sm text-gray-400 mb-2">{label}</div>
      <div className={`text-2xl md:text-3xl font-bold ${colorClasses[color] || colorClasses.white}`}>
        {value}
      </div>
      {subValue}
    </div>
  );
}

export default function Portfolio() {
  const { isConnected, address } = useAccount();
  const { data: accountData, isLoading: accountLoading } = useUserAccountData();
  const { positions, setPositions } = useUserStore();
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // 加载持仓和活动记录
  useEffect(() => {
    if (!isConnected || !address) {
      setPositions(null);
      setActivities([]);
      return;
    }

    const loadData = async () => {
      setActivitiesLoading(true);
      try {
        const positionsResult = await api.getPositions();
        if (positionsResult.data) {
          setPositions(positionsResult.data);
        }

        const activitiesResult = await api.getActivities();
        if (activitiesResult.data?.activities) {
          setActivities(activitiesResult.data.activities);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setActivitiesLoading(false);
      }
    };

    loadData();
  }, [isConnected, address, setPositions]);

  // 未连接钱包
  if (!isConnected) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">我的持仓</h1>
          <p className="text-gray-400 mt-1">管理您的存款和借款</p>
        </div>

        <div className="glass-card p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500/20 to-cyan-500/20 border border-primary-500/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">连接钱包查看持仓</h2>
            <p className="text-gray-400">连接您的钱包以查看和管理您的资产</p>
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
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-white">我的持仓</h1>
        <p className="text-gray-400 mt-1">管理您的存款和借款</p>
      </div>

      {/* 账户概览 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="总资产价值"
          value={accountLoading ? '...' : formatUSD(accountData?.totalCollateralUSD || '0')}
          color="emerald"
        />
        <StatCard
          label="总借款"
          value={accountLoading ? '...' : formatUSD(accountData?.totalDebtUSD || '0')}
          color="amber"
        />
        <StatCard
          label="净资产"
          value={accountLoading ? '...' : formatUSD(
            (parseFloat(accountData?.totalCollateralUSD || '0') - parseFloat(accountData?.totalDebtUSD || '0')).toString()
          )}
        />
        <StatCard
          label="健康因子"
          value={accountLoading ? '...' : healthStatus.value}
          color={healthStatus.color}
          subValue={
            <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-${healthStatus.color}-500/20 text-${healthStatus.color}-400`}>
              <span className={`w-1.5 h-1.5 rounded-full bg-${healthStatus.color}-400`} />
              {healthStatus.label}
            </div>
          }
        />
      </div>

      {/* 信用评分卡片 */}
      <CreditScoreCard compact />

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
