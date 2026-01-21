import { useAccount, useChainId } from 'wagmi';
import { useModalStore } from '../store/useStore';
import { getContractAddresses } from '../config/contracts';
import { useReserveData } from '../hooks/useLendingPool';
import { SUPPORTED_ASSETS } from '../types';

// 格式化大数字
function formatLargeNumber(value: string, decimals: number): string {
  const num = parseFloat(value) / Math.pow(10, decimals);
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

// 格式化APY/APR (假设是27位精度)
function formatRate(rate: bigint | undefined): string {
  if (!rate) return '0.00%';
  const ratePerYear = Number(rate) / 1e27 * 100;
  return `${ratePerYear.toFixed(2)}%`;
}

// 市场行组件
function MarketRow({ asset }: { asset: typeof SUPPORTED_ASSETS[number] }) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const assetAddress = addresses[asset.symbol as keyof typeof addresses] as `0x${string}`;

  const { data: reserveData, isLoading } = useReserveData(assetAddress);
  const { openDepositModal, openBorrowModal } = useModalStore();

  const utilizationRate = reserveData
    ? (Number(reserveData.totalBorrows) / (Number(reserveData.totalDeposits) || 1) * 100).toFixed(1)
    : '0';

  return (
    <tr className="border-b border-primary-500/10 hover:bg-primary-500/5 transition-colors group">
      <td className="py-5 px-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dark-100 to-dark-300 border border-gray-700/50 flex items-center justify-center text-2xl group-hover:border-primary-500/30 transition-colors">
            {asset.icon}
          </div>
          <div>
            <div className="font-semibold text-white group-hover:text-primary-400 transition-colors">{asset.symbol}</div>
            <div className="text-sm text-gray-500">{asset.name}</div>
          </div>
        </div>
      </td>
      <td className="py-5 px-6">
        {isLoading ? (
          <div className="skeleton h-5 w-24" />
        ) : (
          <div>
            <div className="font-medium text-white">{formatLargeNumber(reserveData?.totalDeposits.toString() || '0', asset.decimals)}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-16 h-1.5 bg-dark-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-cyan-500 rounded-full"
                  style={{ width: `${Math.min(parseFloat(utilizationRate), 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{utilizationRate}%</span>
            </div>
          </div>
        )}
      </td>
      <td className="py-5 px-6">
        {isLoading ? (
          <div className="skeleton h-5 w-16" />
        ) : (
          <span className="font-medium text-emerald-400">{formatRate(reserveData?.currentLiquidityRate)}</span>
        )}
      </td>
      <td className="py-5 px-6">
        {isLoading ? (
          <div className="skeleton h-5 w-24" />
        ) : (
          <span className="font-medium text-white">{formatLargeNumber(reserveData?.totalBorrows.toString() || '0', asset.decimals)}</span>
        )}
      </td>
      <td className="py-5 px-6">
        {isLoading ? (
          <div className="skeleton h-5 w-16" />
        ) : (
          <span className="font-medium text-amber-400">{formatRate(reserveData?.currentVariableBorrowRate)}</span>
        )}
      </td>
      <td className="py-5 px-6">
        <div className="flex gap-2">
          <button
            onClick={() => openDepositModal(asset.symbol)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 hover:border-emerald-500/50 transition-all"
          >
            存款
          </button>
          <button
            onClick={() => openBorrowModal(asset.symbol)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-500/20 text-violet-400 border border-violet-500/30 hover:bg-violet-500/30 hover:border-violet-500/50 transition-all"
          >
            借款
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function Markets() {
  const { isConnected } = useAccount();

  const stats = [
    { label: '总存款', value: '$12.5M', change: '+12.3%', color: 'emerald', icon: '📈' },
    { label: '总借款', value: '$8.2M', change: '+8.7%', color: 'violet', icon: '📊' },
    { label: '平均利用率', value: '65.6%', change: '+2.1%', color: 'cyan', icon: '⚡' },
  ];

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">市场</h1>
          <p className="text-gray-400 mt-1">探索所有可用的借贷市场</p>
        </div>
        {!isConnected && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-amber-400">请连接钱包以进行操作</span>
          </div>
        )}
      </div>

      {/* 市场统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="glass-card-hover p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{stat.icon}</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${stat.color}-500/20 text-${stat.color}-400`}>
                {stat.change}
              </span>
            </div>
            <div className="text-sm text-gray-400 mb-1">{stat.label}</div>
            <div className={`text-3xl font-bold text-${stat.color}-400`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* 市场列表 */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-400/50 border-b border-primary-500/10">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">资产</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">总存款 / 利用率</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">存款 APY</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">总借款</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">借款 APR</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {SUPPORTED_ASSETS.map((asset) => (
                <MarketRow key={asset.symbol} asset={asset} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 利率模型说明 */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-primary-500 to-cyan-500 rounded-full" />
          利率模型 (Kink Model)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">工作原理</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              CreditLink 使用双斜率利率模型。当资金利用率低于最优值时，利率缓慢上升；
              当利用率超过最优值时，利率快速上升，以激励还款并保持流动性。
            </p>
            <div className="mt-4 p-4 rounded-xl bg-primary-500/10 border border-primary-500/20">
              <p className="text-xs text-primary-300">
                信用等级越高，借款利率越低。S 级用户可享受最多 <span className="font-semibold">20%</span> 的利率折扣。
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: '基础利率', value: '2%', color: 'text-gray-300' },
              { label: '最优利用率', value: '80%', color: 'text-cyan-400' },
              { label: '斜率1 (利用率 < 最优)', value: '4%', color: 'text-emerald-400' },
              { label: '斜率2 (利用率 > 最优)', value: '75%', color: 'text-amber-400' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-dark-100/50 border border-gray-800/50">
                <span className="text-sm text-gray-400">{item.label}</span>
                <span className={`font-medium ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
