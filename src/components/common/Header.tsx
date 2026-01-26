import { Link, useLocation } from 'react-router-dom';
import { memo, useMemo } from 'react';
import ConnectButton from './ConnectButton';

// 使用 memo 优化 Header 组件，避免不必要的重渲染
export default memo(function Header() {
  const location = useLocation();

  // 使用 useMemo 缓存导航项
  const navItems = useMemo(() => [
    {
      path: '/',
      label: '仪表盘',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
    {
      path: '/markets',
      label: '市场',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      path: '/portfolio',
      label: '我的持仓',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
  ], []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* 玻璃效果背景 - 性能优化：减少 blur 强度 */}
      <div className="absolute inset-0 bg-dark-500/80 backdrop-blur-xl border-b border-primary-500/20" />

      {/* 顶部渐变光带 */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

      {/* 简化光效：使用静态渐变而非动画 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 left-1/4 w-32 h-32 bg-primary-500/8 rounded-full" style={{ filter: 'blur(40px)' }} />
        <div className="absolute -top-10 right-1/4 w-32 h-32 bg-accent-500/8 rounded-full" style={{ filter: 'blur(40px)' }} />
      </div>

      <div className="relative container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo - 优化性能版 */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              {/* 外层光环 - 仅在悬浮时显示 */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 rounded-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300" style={{ filter: 'blur(8px)' }} />

              {/* Logo主体 */}
              <div className="relative w-11 h-11 bg-gradient-to-br from-primary-500 via-primary-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow duration-300 overflow-hidden">
                {/* 内部流光 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                <span className="relative text-white font-bold text-xl tracking-tight">C</span>
              </div>
            </div>

            <div className="hidden sm:block">
              <span className="text-xl font-bold text-gradient">CreditLink</span>
              <div className="flex items-center gap-1.5 -mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-gray-500 tracking-widest uppercase">Lending Protocol</span>
              </div>
            </div>
          </Link>

          {/* 导航 - 霓虹效果 */}
          <nav className="hidden md:flex items-center">
            <div className="flex items-center gap-1 p-1.5 bg-dark-300/50 rounded-2xl border border-gray-800/50 backdrop-blur-sm">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300
                      ${isActive
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                      }
                    `}
                  >
                    {/* 激活状态背景 - 简化动画 */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/25 to-cyan-500/25 rounded-xl border border-primary-500/40" />
                    )}

                    {/* 悬浮效果 */}
                    {!isActive && (
                      <div className="absolute inset-0 bg-dark-100/0 hover:bg-dark-100/50 rounded-xl transition-colors" />
                    )}

                    <span className={`relative z-10 transition-colors ${isActive ? 'text-primary-400' : 'group-hover:text-primary-400'}`}>
                      {item.icon}
                    </span>
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* 右侧按钮区 */}
          <div className="flex items-center gap-3">
            {/* 网络指示器 - 简化动画 */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-dark-300/50 rounded-xl border border-gray-800/50 group hover:border-emerald-500/30 transition-colors">
              <div className="relative flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-emerald-400 transition-colors font-medium">Sepolia</span>
            </div>

            {/* 连接钱包按钮 */}
            <ConnectButton />
          </div>
        </div>

        {/* 移动端导航 */}
        <nav className="md:hidden mt-3 flex items-center justify-center">
          <div className="flex items-center gap-1 p-1.5 bg-dark-300/50 rounded-2xl border border-gray-800/50 backdrop-blur-sm">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    relative flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-medium text-xs transition-all duration-300
                    ${isActive
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/30 to-cyan-500/30 rounded-xl border border-primary-500/40" />
                  )}
                  <span className={`relative z-10 ${isActive ? 'text-primary-400' : ''}`}>{item.icon}</span>
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
});
