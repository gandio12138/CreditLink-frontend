import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { api } from '../../services/api';
import { useUserStore, useModalStore } from '../../store/useStore';
import { TIER_CONFIG } from '../../types';

// 等级配置
const tierStyles: Record<string, { color: string; borderColor: string; bgGradient: string; glowColor: string }> = {
  S: {
    color: 'text-purple-400',
    borderColor: 'border-purple-500/50',
    bgGradient: 'from-purple-500/20 to-purple-900/10',
    glowColor: 'shadow-purple-500/20',
  },
  A: {
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/50',
    bgGradient: 'from-emerald-500/20 to-emerald-900/10',
    glowColor: 'shadow-emerald-500/20',
  },
  B: {
    color: 'text-blue-400',
    borderColor: 'border-blue-500/50',
    bgGradient: 'from-blue-500/20 to-blue-900/10',
    glowColor: 'shadow-blue-500/20',
  },
  C: {
    color: 'text-amber-400',
    borderColor: 'border-amber-500/50',
    bgGradient: 'from-amber-500/20 to-amber-900/10',
    glowColor: 'shadow-amber-500/20',
  },
  D: {
    color: 'text-rose-400',
    borderColor: 'border-rose-500/50',
    bgGradient: 'from-rose-500/20 to-rose-900/10',
    glowColor: 'shadow-rose-500/20',
  },
};

// 信用因子名称映射
const factorNameMap: Record<string, { name: string; icon: string }> = {
  repayment_bonus: { name: '还款奖励', icon: '💳' },
  liquidation_penalty: { name: '清算惩罚', icon: '⚠️' },
  borrow_history_bonus: { name: '借款历史', icon: '📊' },
  loyalty_bonus: { name: '忠诚度奖励', icon: '🏆' },
  health_factor_bonus: { name: '健康因子', icon: '❤️' },
  wallet_age_bonus: { name: '钱包年龄', icon: '⏰' },
  activity_bonus: { name: '活跃度', icon: '⚡' },
  diversity_bonus: { name: '资产多样性', icon: '🎯' },
  net_worth_bonus: { name: '净资产', icon: '💰' },
};

interface CreditScoreCardProps {
  compact?: boolean;
}

export default function CreditScoreCard({ compact = false }: CreditScoreCardProps) {
  const { isConnected, address } = useAccount();
  const { creditInfo, setCreditInfo } = useUserStore();
  const { openCreditDetailModal } = useModalStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 加载信用信息
  useEffect(() => {
    if (!isConnected || !address) {
      setCreditInfo(null);
      return;
    }

    const loadCreditInfo = async () => {
      setIsLoading(true);
      try {
        const result = await api.getCredit();
        if (result.data) {
          setCreditInfo(result.data);
        }
      } catch (error) {
        console.error('加载信用信息失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCreditInfo();
  }, [isConnected, address, setCreditInfo]);

  // 刷新信用分
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await api.refreshCredit();
      if (result.data) {
        const creditResult = await api.getCredit();
        if (creditResult.data) {
          setCreditInfo(creditResult.data);
        }
      }
    } catch (error) {
      console.error('刷新信用分失败:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 未连接钱包
  if (!isConnected) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-primary-500 to-cyan-500 rounded-full" />
          信用评分
        </h2>
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-gray-500">连接钱包查看您的信用评分</p>
        </div>
      </div>
    );
  }

  // 加载中
  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-primary-500 to-cyan-500 rounded-full" />
          信用评分
        </h2>
        <div className="flex items-start gap-8">
          <div className="w-32 h-32 rounded-2xl skeleton" />
          <div className="flex-1 space-y-4">
            <div className="skeleton h-6 w-32" />
            <div className="skeleton h-5 w-24" />
            <div className="skeleton h-5 w-28" />
          </div>
        </div>
      </div>
    );
  }

  // 默认信用信息
  const score = creditInfo?.score ?? 500;
  const tier = creditInfo?.tier ?? 'C';
  const maxLtv = creditInfo?.maxLtv ?? 7000;
  const maxBorrow = creditInfo?.maxBorrow ?? '10000';
  const factors = creditInfo?.factors ?? [];

  const style = tierStyles[tier] || tierStyles.C;
  const scoreProgress = (score / 1000) * 100;
  const tierLabel = TIER_CONFIG[tier as keyof typeof TIER_CONFIG]?.label || '未知';

  // 紧凑模式
  if (compact) {
    return (
      <div
        className={`glass-card-hover p-5 bg-gradient-to-br ${style.bgGradient} border ${style.borderColor} cursor-pointer`}
        onClick={openCreditDetailModal}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`relative w-16 h-16 rounded-2xl border-2 ${style.borderColor} flex items-center justify-center bg-dark-300/50`}>
              <span className={`text-2xl font-bold ${style.color}`}>{tier}</span>
              <div className={`absolute inset-0 rounded-2xl blur-md ${style.color.replace('text', 'bg')}/20`} />
            </div>
            <div>
              <div className="text-sm text-gray-400">信用评分</div>
              <div className="text-2xl font-bold text-white">{score}</div>
              <div className={`text-sm ${style.color}`}>{tierLabel}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">您的 LTV</div>
            <div className="text-xl font-bold text-white">{maxLtv / 100}%</div>
            <div className="text-xs text-gray-500">基础 70%</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>0</span>
            <span>1000</span>
          </div>
          <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${style.color.replace('text', 'bg')}`}
              style={{ width: `${scoreProgress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-card overflow-hidden border ${style.borderColor}`}>
      {/* 头部 */}
      <div className={`p-6 bg-gradient-to-r ${style.bgGradient} to-transparent border-b ${style.borderColor}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-primary-500 to-cyan-500 rounded-full" />
            信用评分
          </h2>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-300/50 border border-gray-700/50 hover:border-primary-500/30 transition-all text-sm text-gray-400 hover:text-white disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            刷新
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-8">
          {/* 分数圆环 */}
          <div className="flex-shrink-0">
            <div className={`relative w-40 h-40 rounded-3xl border-4 ${style.borderColor} flex items-center justify-center bg-dark-300/30 shadow-lg ${style.glowColor}`}>
              <div className={`absolute inset-2 rounded-2xl blur-xl ${style.color.replace('text', 'bg')}/10`} />
              <div className="relative text-center">
                <div className="text-5xl font-bold text-white">{score}</div>
                <div className="text-sm text-gray-400 mt-1">/1000</div>
              </div>
              <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-sm font-bold ${style.color} bg-dark-300 border ${style.borderColor}`}>
                {tier} 级
              </div>
            </div>
          </div>

          {/* 详细信息 */}
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-dark-100/50 border border-gray-800/50">
                <div className="text-sm text-gray-400 mb-1">信用等级</div>
                <div className={`text-xl font-bold ${style.color}`}>{tier} ({tierLabel})</div>
              </div>
              <div className="p-4 rounded-xl bg-dark-100/50 border border-gray-800/50">
                <div className="text-sm text-gray-400 mb-1">您的 LTV</div>
                <div className="text-xl font-bold text-white">{maxLtv / 100}%</div>
                <div className="text-xs text-gray-500">基础: 70%</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-dark-100/50 border border-gray-800/50">
              <div className="text-sm text-gray-400 mb-1">最大借款额度</div>
              <div className="text-2xl font-bold text-white">
                ${Number(maxBorrow).toLocaleString()}
              </div>
            </div>

            {/* 进度条 */}
            <div>
              <div className="flex justify-between text-xs mb-2">
                <div className="flex gap-4">
                  {['D', 'C', 'B', 'A', 'S'].map((t) => (
                    <span
                      key={t}
                      className={`${tier === t ? style.color + ' font-bold' : 'text-gray-500'}`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="h-3 bg-dark-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${style.color.replace('text', 'bg')}`}
                  style={{ width: `${scoreProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0</span>
                <span>400</span>
                <span>600</span>
                <span>800</span>
                <span>900</span>
                <span>1000</span>
              </div>
            </div>
          </div>
        </div>

        {/* 信用因子 */}
        {factors.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-800/50">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">评分因子</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {factors.map((factor) => {
                const factorInfo = factorNameMap[factor.key] || { name: factor.key, icon: '📌' };
                const isPositive = factor.contribution >= 0;
                return (
                  <div
                    key={factor.key}
                    className={`p-3 rounded-xl border transition-all ${
                      isPositive
                        ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                        : 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{factorInfo.icon}</span>
                      <span className="text-xs text-gray-400 truncate">{factorInfo.name}</span>
                    </div>
                    <div className={`text-lg font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? '+' : ''}{factor.contribution}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={openCreditDetailModal}
            className="flex-1 px-4 py-3 rounded-xl bg-dark-100/50 border border-gray-700/50 hover:border-primary-500/30 transition-all text-gray-300 hover:text-white font-medium"
          >
            查看详情
          </button>
          <button className="flex-1 px-4 py-3 rounded-xl btn-gradient">
            如何提升
          </button>
        </div>
      </div>
    </div>
  );
}
