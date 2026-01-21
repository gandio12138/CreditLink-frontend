import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useUserAccountData } from '../../hooks/useLendingPool';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
  icon?: React.ReactNode;
  gradient: string;
  borderColor: string;
}

function StatCard({ title, value, subtitle, color = 'text-white', icon, gradient, borderColor }: StatCardProps) {
  return (
    <div className={`glass-card-hover p-6 bg-gradient-to-br ${gradient} border ${borderColor}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm font-medium">{title}</span>
        {icon && (
          <div className={`w-10 h-10 rounded-xl ${color.replace('text', 'bg')}/20 flex items-center justify-center`}>
            <span className={color}>{icon}</span>
          </div>
        )}
      </div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      {subtitle && <div className="text-gray-500 text-sm mt-2">{subtitle}</div>}
    </div>
  );
}

// 格式化美元金额
function formatUSD(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

// 获取健康因子颜色和样式
function getHealthFactorStyle(hf: string): { color: string; gradient: string; borderColor: string } {
  const value = parseFloat(hf);
  if (isNaN(value) || value === 0) return {
    color: 'text-gray-400',
    gradient: 'from-gray-500/10 to-gray-600/5',
    borderColor: 'border-gray-500/20',
  };
  if (value >= 2) return {
    color: 'text-emerald-400',
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    borderColor: 'border-emerald-500/20',
  };
  if (value >= 1.5) return {
    color: 'text-cyan-400',
    gradient: 'from-cyan-500/10 to-cyan-600/5',
    borderColor: 'border-cyan-500/20',
  };
  if (value >= 1.15) return {
    color: 'text-amber-400',
    gradient: 'from-amber-500/10 to-amber-600/5',
    borderColor: 'border-amber-500/20',
  };
  return {
    color: 'text-rose-400',
    gradient: 'from-rose-500/10 to-rose-600/5',
    borderColor: 'border-rose-500/20',
  };
}

// 获取健康因子状态
function getHealthFactorStatus(hf: string): string {
  const value = parseFloat(hf);
  if (isNaN(value) || value === 0) return '无借款';
  if (value >= 2) return '非常安全';
  if (value >= 1.5) return '安全';
  if (value >= 1.15) return '需关注';
  return '危险';
}

export default function AccountSummary() {
  const { isConnected } = useAccount();
  const { data: accountData, isLoading, refetch } = useUserAccountData();

  // 定期刷新数据
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected, refetch]);

  if (!isConnected) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: '总存款', gradient: 'from-emerald-500/10 to-emerald-600/5', borderColor: 'border-emerald-500/20' },
          { title: '总借款', gradient: 'from-amber-500/10 to-amber-600/5', borderColor: 'border-amber-500/20' },
          { title: '健康因子', gradient: 'from-cyan-500/10 to-cyan-600/5', borderColor: 'border-cyan-500/20' },
        ].map((item, index) => (
          <div key={index} className={`glass-card p-6 bg-gradient-to-br ${item.gradient} border ${item.borderColor}`}>
            <div className="text-gray-400 text-sm mb-3">{item.title}</div>
            <div className="text-2xl font-bold text-gray-500">--</div>
            <div className="text-gray-600 text-sm mt-2">请连接钱包</div>
          </div>
        ))}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-6">
            <div className="skeleton h-4 w-20 mb-4" />
            <div className="skeleton h-8 w-32" />
            <div className="skeleton h-4 w-28 mt-3" />
          </div>
        ))}
      </div>
    );
  }

  const totalSupply = accountData?.totalCollateralUSD || '0';
  const totalBorrow = accountData?.totalDebtUSD || '0';
  const healthFactor = accountData?.healthFactor || '0';
  const availableBorrow = accountData?.availableBorrowUSD || '0';
  const netWorth = (parseFloat(totalSupply) - parseFloat(totalBorrow)).toString();
  const borrowUtilization = parseFloat(totalSupply) > 0
    ? ((parseFloat(totalBorrow) / parseFloat(totalSupply)) * 100).toFixed(1)
    : '0';

  const hfStyle = getHealthFactorStyle(healthFactor);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        title="总存款"
        value={formatUSD(totalSupply)}
        subtitle={`净值: ${formatUSD(netWorth)}`}
        color="text-emerald-400"
        gradient="from-emerald-500/10 to-emerald-600/5"
        borderColor="border-emerald-500/20"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        }
      />
      <StatCard
        title="总借款"
        value={formatUSD(totalBorrow)}
        subtitle={`可借额度: ${formatUSD(availableBorrow)}`}
        color="text-amber-400"
        gradient="from-amber-500/10 to-amber-600/5"
        borderColor="border-amber-500/20"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
      />
      <StatCard
        title="健康因子"
        value={parseFloat(healthFactor) === 0 ? '∞' : parseFloat(healthFactor).toFixed(2)}
        subtitle={`${getHealthFactorStatus(healthFactor)} | 利用率: ${borrowUtilization}%`}
        color={hfStyle.color}
        gradient={hfStyle.gradient}
        borderColor={hfStyle.borderColor}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        }
      />
    </div>
  );
}
