import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Link } from 'react-router-dom';
import CreditScoreCard from '../components/credit/CreditScoreCard';
import AccountSummary from '../components/dashboard/AccountSummary';
import { useModalStore } from '../store/useStore';
import { api } from '../services/api';
import type { ActivityRecord } from '../types';
import { SUPPORTED_ASSETS } from '../types';

// 简化的市场展示数据类型
interface MarketDisplayData {
  symbol: string;
  name: string;
  totalSupplyUSD: string;
  supplyAPY: string;
  borrowAPR: string;
  icon: string;
}

// 格式化日期
function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
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

// Hero区域组件 - 超级炫酷版
function HeroSection({ isConnected }: { isConnected: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary-500/20 p-8 md:p-12 group">
      {/* 动态渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-300 via-dark-400 to-dark-500" />

      {/* 流动光效 */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-50 animate-gradient-xy" />

      {/* 旋转边框光效 */}
      <div className="absolute inset-0 rotating-border opacity-30" />

      {/* 能量波纹 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="energy-ripple" />
      </div>

      {/* 悬浮光球 */}
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary-500/30 rounded-full blur-[80px] animate-pulse-slow group-hover:bg-primary-400/40 transition-colors duration-1000" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-accent-500/25 rounded-full blur-[60px] animate-pulse-slow group-hover:bg-accent-400/35 transition-colors duration-1000" style={{ animationDelay: '1s' }} />

      {/* 粒子装饰 */}
      <div className="absolute top-10 right-20 w-2 h-2 bg-primary-400 rounded-full animate-float opacity-60" />
      <div className="absolute top-20 right-40 w-1.5 h-1.5 bg-accent-400 rounded-full animate-float-slow opacity-50" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-20 left-20 w-2 h-2 bg-neon-cyan rounded-full animate-float opacity-40" style={{ animationDelay: '1s' }} />

      {/* 网格背景 */}
      <div className="absolute inset-0 grid-bg opacity-30" />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-4">
            {/* 状态标签 - 脉冲效果 */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/20 rounded-full border border-primary-500/30 backdrop-blur-sm animate-fade-in">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500" />
              </span>
              <span className="text-sm text-primary-300 font-medium">链上信用借贷协议</span>
            </div>

            {/* 标题 - 动态渐变 */}
            <h1 className="text-4xl md:text-6xl font-bold animate-fade-in-up">
              <span className="text-gradient-animated">CreditLink</span>
            </h1>

            {/* 描述 */}
            <p className="text-gray-400 text-lg max-w-lg animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              {isConnected
                ? '欢迎回来！您的链上信用正在为您创造更多价值'
                : '建立链上信用，解锁更高借款额度，享受DeFi借贷新体验'}
            </p>
          </div>

          {!isConnected && (
            <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/markets" className="btn-neon text-center group">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  开始探索
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              <a
                href="https://docs.creditlink.io"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl font-semibold text-gray-300 bg-dark-100/50 border border-gray-700 hover:border-primary-500/50 hover:text-white transition-all text-center backdrop-blur-sm"
              >
                了解更多
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 平台统计组件 - 3D卡片效果
function PlatformStats() {
  const stats = [
    { label: '总锁仓价值', value: '$12.5M', icon: '🔒', gradient: 'from-primary-500 to-primary-700', delay: '0ms' },
    { label: '总存款', value: '$8.2M', icon: '💰', gradient: 'from-emerald-500 to-emerald-700', delay: '100ms' },
    { label: '总借款', value: '$4.3M', icon: '📊', gradient: 'from-violet-500 to-violet-700', delay: '200ms' },
    { label: '活跃用户', value: '1,234', icon: '👥', gradient: 'from-cyan-500 to-cyan-700', delay: '300ms' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="card-3d animate-fade-in-up"
          style={{ animationDelay: stat.delay }}
        >
          <div className="card-3d-inner glass-card-hover p-5 h-full">
            {/* 背景渐变 */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-2xl`} />

            {/* 光效 */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-2xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl animate-float" style={{ animationDelay: `${index * 200}ms` }}>{stat.icon}</span>
                <span className="text-sm text-gray-400">{stat.label}</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 快速操作组件 - 流光效果
function QuickActions() {
  const { openDepositModal, openBorrowModal } = useModalStore();

  const actions = [
    {
      label: '存款',
      description: '存入资产赚取收益',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-glow-green',
      onClick: () => openDepositModal('USDT'),
    },
    {
      label: '借款',
      description: '使用抵押品获取资金',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'shadow-glow',
      onClick: () => openBorrowModal('USDT'),
    },
  ];

  return (
    <div className="glow-border-card p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-gradient-to-b from-primary-500 to-cyan-500 rounded-full animate-pulse" />
        <span className="text-gradient">快速操作</span>
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`group relative overflow-hidden flex flex-col items-center gap-3 p-6 rounded-2xl bg-dark-300/50 border border-gray-700/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:${action.shadow}`}
          >
            {/* 悬浮时的渐变背景 */}
            <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />

            {/* 流光效果 */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>

            <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white transform group-hover:scale-110 transition-transform duration-300`}>
              {action.icon}
              {/* 脉冲环 */}
              <div className="absolute inset-0 rounded-2xl animate-ping-slow opacity-0 group-hover:opacity-30 bg-current" />
            </div>
            <div className="relative text-center">
              <div className="font-semibold text-white group-hover:text-gradient transition-all">{action.label}</div>
              <div className="text-xs text-gray-400 mt-1">{action.description}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link
          to="/markets"
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-dark-100/50 border border-gray-700/50 hover:border-primary-500/50 hover:bg-primary-500/10 transition-all text-gray-300 hover:text-white group"
        >
          <svg className="w-5 h-5 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          查看市场
        </Link>
        <Link
          to="/portfolio"
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-dark-100/50 border border-gray-700/50 hover:border-accent-500/50 hover:bg-accent-500/10 transition-all text-gray-300 hover:text-white group"
        >
          <svg className="w-5 h-5 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          我的持仓
        </Link>
      </div>
    </div>
  );
}

// 借款能力组件 - 霓虹进度条
function BorrowingPower() {
  return (
    <div className="glass-card-hover p-6 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl" />

      <h2 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
        <span className="w-1 h-6 bg-gradient-to-b from-primary-500 to-cyan-500 rounded-full animate-pulse" />
        <span className="text-gradient">借款能力</span>
      </h2>
      <div className="space-y-5 relative z-10">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">基础 LTV</span>
            <span className="text-white font-medium">70%</span>
          </div>
          <div className="progress-bar-neon">
            <div className="progress-bar-neon-fill" style={{ width: '70%' }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">清算阈值</span>
            <span className="text-amber-400 font-medium">85%</span>
          </div>
          <div className="h-2 bg-dark-300/50 rounded-full overflow-hidden border border-amber-500/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 relative"
              style={{ width: '85%' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-gray-700/50">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-primary-500/10 to-cyan-500/10 border border-primary-500/20 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0 animate-pulse">
              <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs text-gray-300">
              提升信用等级可获得更高的借款 LTV，S 级用户最高可达 <span className="text-gradient font-semibold">95%</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 市场概览组件 - 卡片悬浮效果
function MarketOverview({ markets }: { markets: MarketDisplayData[] }) {
  const { openDepositModal, openBorrowModal } = useModalStore();

  return (
    <div className="glass-card-hover p-6 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent-500/10 rounded-full blur-3xl" />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-primary-500 to-cyan-500 rounded-full animate-pulse" />
          <span className="text-gradient">热门市场</span>
        </h2>
        <Link to="/markets" className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1 group">
          查看全部
          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      <div className="space-y-3 relative z-10">
        {markets.slice(0, 4).map((market, index) => (
          <div
            key={market.symbol}
            className="flex items-center justify-between p-4 rounded-xl bg-dark-100/50 border border-gray-700/30 hover:border-primary-500/50 transition-all group hover:bg-dark-100/80 animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dark-100 to-dark-300 border border-gray-700/50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                {market.icon}
              </div>
              <div>
                <div className="font-semibold text-white group-hover:text-gradient transition-all">{market.symbol}</div>
                <div className="text-sm text-gray-500">{market.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <div className="text-sm text-gray-400">存款 APY</div>
                <div className="text-emerald-400 font-medium">{market.supplyAPY}%</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openDepositModal(market.symbol)}
                  className="px-3 py-1.5 text-sm rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-400 transition-all hover:shadow-glow-green"
                >
                  存款
                </button>
                <button
                  onClick={() => openBorrowModal(market.symbol)}
                  className="px-3 py-1.5 text-sm rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 border border-violet-500/30 hover:border-violet-400 transition-all hover:shadow-glow"
                >
                  借款
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 最近活动组件
function RecentActivity({ activities }: { activities: ActivityRecord[] }) {
  if (activities.length === 0) {
    return (
      <div className="glass-card-hover p-6 relative overflow-hidden">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-primary-500 to-cyan-500 rounded-full animate-pulse" />
          <span className="text-gradient">最近活动</span>
        </h2>
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-dark-100 to-dark-300 border border-gray-700/50 flex items-center justify-center animate-float">
            <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-400 font-medium">暂无交易记录</p>
          <p className="text-gray-500 text-sm mt-1">开始存款或借款后这里会显示您的活动</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card-hover p-6 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl" />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-primary-500 to-cyan-500 rounded-full animate-pulse" />
          <span className="text-gradient">最近活动</span>
        </h2>
        <Link to="/portfolio" className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1 group">
          查看全部
          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      <div className="space-y-3 relative z-10">
        {activities.slice(0, 5).map((activity, index) => {
          const actionInfo = actionTypeMap[activity.actionType] || {
            label: activity.actionType,
            color: 'text-gray-400',
            bgColor: 'bg-gray-500/20',
          };
          return (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-xl bg-dark-100/30 border border-gray-800/50 hover:border-gray-700 transition-all animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-lg text-sm font-medium ${actionInfo.bgColor} ${actionInfo.color} border border-current/20`}>
                  {actionInfo.label}
                </div>
                <span className="text-gray-300 font-medium">
                  {parseFloat(activity.amount).toFixed(4)}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(activity.timestamp)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 功能介绍组件 - 3D卡片
function FeatureCards() {
  const features = [
    {
      icon: '💰',
      title: '存款赚取收益',
      description: '存入您的资产，自动赚取利息收益，同时作为抵押品获得借款能力',
      gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      iconBg: 'from-emerald-500 to-teal-600',
      delay: '0ms',
    },
    {
      icon: '🛡️',
      title: '信用增强借款',
      description: '建立链上信用评分，获得更高的贷款价值比(LTV)，借出更多资金',
      gradient: 'from-violet-500/20 via-purple-500/10 to-transparent',
      iconBg: 'from-violet-500 to-purple-600',
      delay: '100ms',
    },
    {
      icon: '⚡',
      title: '安全透明',
      description: '智能合约保障资金安全，所有操作链上可查，完全去中心化运行',
      gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
      iconBg: 'from-cyan-500 to-blue-600',
      delay: '200ms',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((feature, index) => (
        <div
          key={index}
          className="card-3d animate-fade-in-up"
          style={{ animationDelay: feature.delay }}
        >
          <div className="card-3d-inner glass-card-hover p-6 h-full relative overflow-hidden group">
            {/* 渐变背景 */}
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-50 group-hover:opacity-70 transition-opacity`} />

            {/* 发光效果 */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all" />

            <div className="relative z-10">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.iconBg} flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-gradient transition-all">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 未连接引导组件 - 超级炫酷版
function ConnectWalletGuide() {
  return (
    <div className="glow-border-card p-8 md:p-12 text-center relative overflow-hidden">
      {/* 背景光效 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-radial from-primary-500/30 via-primary-500/10 to-transparent blur-3xl" />

      {/* 能量波纹 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
        <div className="energy-ripple" />
      </div>

      <div className="relative z-10">
        {/* 动画图标 */}
        <div className="w-24 h-24 mx-auto mb-6 relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/30 to-cyan-500/30 border border-primary-500/30 animate-morph" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-primary-400 animate-float" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          {/* 脉冲环 */}
          <div className="absolute inset-0 rounded-2xl animate-ping-slow opacity-20 bg-primary-500" />
        </div>

        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          <span className="text-gradient-animated">连接您的钱包</span>
        </h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          连接钱包后，您可以存款赚取收益、借款获得资金，并建立您的链上信用评分
        </p>
        <Link
          to="/markets"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-cyan-500 text-white font-semibold hover:from-primary-400 hover:to-cyan-400 transition-all shadow-neon hover:shadow-neon-cyan group"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          浏览市场
          <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { isConnected, address } = useAccount();
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [markets] = useState<MarketDisplayData[]>(() =>
    SUPPORTED_ASSETS.map((asset) => ({
      symbol: asset.symbol,
      name: asset.name,
      totalSupplyUSD: '1000000',
      supplyAPY: '3.2',
      borrowAPR: '5.1',
      icon: asset.icon,
    }))
  );

  // 加载用户活动数据
  useEffect(() => {
    if (!isConnected || !address) {
      setActivities([]);
      return;
    }

    const loadActivities = async () => {
      try {
        const activitiesResult = await api.getActivities();
        if (activitiesResult.data?.activities) {
          setActivities(activitiesResult.data.activities);
        }
      } catch (error) {
        console.error('加载活动数据失败:', error);
      }
    };

    loadActivities();
  }, [isConnected, address]);

  return (
    <div className="space-y-8">
      {/* Hero区域 */}
      <HeroSection isConnected={isConnected} />

      {/* 平台统计 */}
      <PlatformStats />

      {isConnected ? (
        <>
          {/* 账户概览 */}
          <AccountSummary />

          {/* 快速操作和借款能力 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <QuickActions />
            </div>
            <BorrowingPower />
          </div>

          {/* 信用评分 */}
          <CreditScoreCard />

          {/* 市场和活动 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MarketOverview markets={markets} />
            <RecentActivity activities={activities} />
          </div>
        </>
      ) : (
        <>
          {/* 未连接钱包时的引导 */}
          <ConnectWalletGuide />

          {/* 功能介绍 */}
          <FeatureCards />

          {/* 市场概览 */}
          <MarketOverview markets={markets} />
        </>
      )}
    </div>
  );
}
