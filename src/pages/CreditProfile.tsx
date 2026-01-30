import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useCreditInfo } from '../hooks/useApiQueries';
import { CREDIT_DIMENSIONS, calculateDimensionScores } from '../data/mockData';

// 信用等级配置
const TIER_CONFIG: Record<string, { label: string; color: string; bgColor: string; minScore: number; maxLtv: number }> = {
  S: { label: '卓越', color: 'text-accent-400', bgColor: 'bg-accent-500/10', minScore: 900, maxLtv: 95 },
  A: { label: '优秀', color: 'text-success-400', bgColor: 'bg-success-500/10', minScore: 750, maxLtv: 85 },
  B: { label: '良好', color: 'text-info-400', bgColor: 'bg-info-500/10', minScore: 600, maxLtv: 75 },
  C: { label: '一般', color: 'text-warning-400', bgColor: 'bg-warning-500/10', minScore: 450, maxLtv: 70 },
  D: { label: '待提升', color: 'text-danger-400', bgColor: 'bg-danger-500/10', minScore: 0, maxLtv: 60 },
};

export default function CreditProfile() {
  const { isConnected } = useAccount();
  const { data: creditInfo, isLoading } = useCreditInfo();

  // 信用等级配置
  const tierConfig = useMemo(() => {
    return TIER_CONFIG[creditInfo?.tier || 'C'];
  }, [creditInfo?.tier]);

  // 从 API 返回的 factors 计算维度分数
  const radarData = useMemo(() => {
    if (!creditInfo?.factors || creditInfo.factors.length === 0) {
      // 如果没有因子数据，使用默认值
      return CREDIT_DIMENSIONS.map((dim) => ({
        ...dim,
        value: 50,
      }));
    }

    const dimensionScores = calculateDimensionScores(creditInfo.factors);

    return CREDIT_DIMENSIONS.map((dim) => ({
      ...dim,
      value: dimensionScores[dim.key] || 50,
    }));
  }, [creditInfo?.factors]);

  // 提分建议 - 基于实际的信用因子数据
  const suggestions = useMemo(() => {
    const baseSuggestions = [
      { action: '增加 $500 存款', impact: '+10 分', difficulty: '简单' },
      { action: '完成 3 笔按时还款', impact: '+15 分', difficulty: '中等' },
      { action: '持有资产超过 30 天', impact: '+8 分', difficulty: '需时间' },
    ];

    // 根据当前因子数据调整建议
    if (creditInfo?.factors) {
      const hasRepaymentBonus = creditInfo.factors.some(f => f.key === 'repayment_bonus' && f.contribution > 0);
      const hasLoyaltyBonus = creditInfo.factors.some(f => f.key === 'loyalty_bonus' && f.contribution > 0);

      if (!hasRepaymentBonus) {
        baseSuggestions.unshift({ action: '进行首次借款并按时还款', impact: '+20 分', difficulty: '中等' });
      }
      if (!hasLoyaltyBonus) {
        baseSuggestions.push({ action: '持续使用平台超过 30 天', impact: '+10 分', difficulty: '需时间' });
      }
    }

    return baseSuggestions.slice(0, 4);
  }, [creditInfo?.factors]);

  // 格式化历史记录事件
  const formatEventType = (event: string) => {
    const eventMap: Record<string, string> = {
      INITIAL_SCORE: '初始评分',
      SCORE_INCREASE: '分数上升',
      SCORE_DECREASE: '分数下降',
      SCORE_CALCULATED: '分数计算',
    };
    return eventMap[event] || event;
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">连接钱包</h2>
          <p className="text-slate-400 mb-6">请先连接您的钱包以查看信用评分</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">信用中心</h1>
        <p className="text-slate-400 mt-1">您的链上信用档案</p>
      </div>

      {/* 信用概览卡片 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 信用分主卡 */}
        <div className="lg:col-span-1">
          <div className="card p-6 h-full">
            <div className="text-center">
              {/* 信用等级徽章 */}
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${tierConfig.bgColor} mb-4`}>
                {isLoading ? (
                  <div className="w-12 h-12 skeleton rounded-lg" />
                ) : (
                  <span className={`text-4xl font-bold ${tierConfig.color}`}>
                    {creditInfo?.tier || 'C'}
                  </span>
                )}
              </div>

              {/* 信用分数 */}
              <div className="mb-2">
                {isLoading ? (
                  <div className="h-10 w-24 skeleton rounded mx-auto" />
                ) : (
                  <div className="text-4xl font-bold text-slate-100 tabular-nums">
                    {creditInfo?.score || 500}
                  </div>
                )}
              </div>

              <div className="text-slate-400 text-sm mb-4">
                信用等级: <span className={tierConfig.color}>{tierConfig.label}</span>
              </div>

              {/* 信用分进度条 */}
              <div className="relative">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                    style={{ width: `${((creditInfo?.score || 500) / 1000) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-slate-500">
                  <span>0</span>
                  <span>500</span>
                  <span>1000</span>
                </div>
              </div>

              {/* LTV 特权 */}
              <div className="mt-6 p-4 bg-slate-800/50 rounded-xl">
                <div className="text-sm text-slate-400 mb-1">您的借款 LTV</div>
                <div className={`text-2xl font-bold ${tierConfig.color}`}>
                  {creditInfo?.maxLtv ? creditInfo.maxLtv / 100 : tierConfig.maxLtv}%
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  基础 LTV 70% + 信用加成
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 信用雷达图 */}
        <div className="lg:col-span-2">
          <div className="card p-6 h-full">
            <h3 className="font-semibold text-slate-100 mb-4">信用维度分析</h3>

            {/* 维度展示 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl">
                    <div className="w-10 h-10 skeleton rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 w-20 skeleton rounded mb-2" />
                      <div className="h-1.5 w-full skeleton rounded" />
                    </div>
                  </div>
                ))
              ) : (
                radarData.map((dim) => (
                  <div key={dim.key} className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg">
                      {dim.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-300">{dim.label}</span>
                        <span className="text-sm font-medium text-slate-100">{Math.round(dim.value)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                          style={{ width: `${dim.value}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 因子详情 */}
            {creditInfo?.factors && creditInfo.factors.length > 0 && (
              <div className="mt-4 p-4 bg-slate-800/20 rounded-xl">
                <div className="text-sm text-slate-400 mb-2">信用因子贡献</div>
                <div className="flex flex-wrap gap-2">
                  {creditInfo.factors.map((factor, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 text-xs rounded-lg ${
                        factor.contribution > 0
                          ? 'bg-success-500/20 text-success-400'
                          : factor.contribution < 0
                          ? 'bg-danger-500/20 text-danger-400'
                          : 'bg-slate-700/50 text-slate-400'
                      }`}
                    >
                      {factor.key.replace(/_/g, ' ')}: {factor.contribution > 0 ? '+' : ''}{factor.contribution}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 更新时间 */}
            <div className="mt-4 text-xs text-slate-500 text-right">
              最后更新: {new Date().toLocaleDateString('zh-CN')}
            </div>
          </div>
        </div>
      </div>

      {/* 信用历史 */}
      {creditInfo?.history && creditInfo.history.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="font-semibold text-slate-100">信用历史</h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {creditInfo.history.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      item.event === 'SCORE_INCREASE' ? 'bg-success-500/20 text-success-400' :
                      item.event === 'SCORE_DECREASE' ? 'bg-danger-500/20 text-danger-400' :
                      'bg-slate-700/50 text-slate-400'
                    }`}>
                      {item.event === 'SCORE_INCREASE' ? '↑' :
                       item.event === 'SCORE_DECREASE' ? '↓' : '●'}
                    </div>
                    <div>
                      <div className="text-sm text-slate-200">{formatEventType(item.event)}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(item.timestamp * 1000).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-slate-100">{item.score}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 提分建议 */}
      <div className="card">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="font-semibold text-slate-100">提分建议</h3>
          <p className="text-sm text-slate-400 mt-1">完成以下操作可提升您的信用分数</p>
        </div>
        <div className="divide-y divide-slate-700/50">
          {suggestions.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-slate-100">{item.action}</div>
                  <div className="text-sm text-slate-500">难度: {item.difficulty}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-success-400 font-medium">{item.impact}</span>
                <button className="btn-secondary text-sm py-1.5 px-3">
                  去完成
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 信用等级说明 */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-100 mb-4">信用等级说明</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(TIER_CONFIG).map(([tier, config]) => (
            <div
              key={tier}
              className={`p-4 rounded-xl border ${
                tier === creditInfo?.tier
                  ? 'border-primary-500/50 bg-primary-500/5'
                  : 'border-slate-700/50'
              }`}
            >
              <div className={`text-2xl font-bold ${config.color} mb-1`}>{tier}</div>
              <div className="text-sm text-slate-400">{config.label}</div>
              <div className="text-xs text-slate-500 mt-2">
                {config.minScore}+ 分
              </div>
              <div className="text-xs text-slate-500">
                LTV {config.maxLtv}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
