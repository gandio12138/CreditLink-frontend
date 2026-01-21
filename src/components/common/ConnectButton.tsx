import { useState, useEffect, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useSignMessage } from 'wagmi';
import { api } from '../../services/api';
import { useUserStore } from '../../store/useStore';

export default function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error, reset } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { data: balance } = useBalance({ address });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { setIsAuthenticated } = useUserStore();

  // 处理连接错误
  useEffect(() => {
    if (error) {
      console.log('钱包连接被取消或出错:', error.message);
      setIsConnecting(false);

      if (error.message.includes('already pending')) {
        setPendingError('MetaMask有待处理的请求，请打开MetaMask扩展处理或锁定后重新解锁');
      } else {
        setPendingError(null);
      }
      reset();
    }
  }, [error, reset]);

  // 后端登录流程
  const loginToBackend = useCallback(async (walletAddress: string) => {
    if (isLoggingIn || api.isAuthenticated()) {
      setIsAuthenticated(true);
      return;
    }

    setIsLoggingIn(true);
    try {
      // 1. 获取 nonce
      const nonceResult = await api.getNonce(walletAddress);
      if (nonceResult.error || !nonceResult.data) {
        console.error('获取 nonce 失败:', nonceResult.error);
        setPendingError('获取登录凭证失败');
        return;
      }

      const { message } = nonceResult.data;

      // 2. 签名消息
      const signature = await signMessageAsync({ message });

      // 3. 登录获取 JWT
      const loginResult = await api.login(walletAddress, signature, message);
      if (loginResult.error || !loginResult.data) {
        console.error('登录失败:', loginResult.error);
        setPendingError('登录失败');
        return;
      }

      console.log('登录成功');
      setIsAuthenticated(true);
    } catch (err) {
      console.error('登录过程出错:', err);
      setPendingError('签名被取消或出错');
    } finally {
      setIsLoggingIn(false);
    }
  }, [isLoggingIn, signMessageAsync, setIsAuthenticated]);

  // 处理连接 - 打开钱包选择模态框
  const handleConnect = useCallback(() => {
    if (isConnecting || isPending) return;
    setPendingError(null);
    setShowWalletModal(true);
  }, [isConnecting, isPending]);

  // 检查是否有浏览器钱包
  const hasInjectedWallet = typeof window !== 'undefined' && window.ethereum;

  // 选择特定钱包进行连接
  const handleSelectWallet = useCallback((connector: typeof connectors[number]) => {
    // 如果是 injected 类型但没有安装钱包扩展
    if ((connector.name === 'Injected' || connector.name.toLowerCase().includes('metamask')) && !hasInjectedWallet) {
      // 打开 MetaMask 下载页面
      window.open('https://metamask.io/download/', '_blank');
      setPendingError('请先安装 MetaMask 浏览器扩展，安装后刷新页面重试');
      setShowWalletModal(false);
      return;
    }
    setIsConnecting(true);
    setShowWalletModal(false);
    connect({ connector });
  }, [connect, hasInjectedWallet]);

  // 连接成功后执行登录
  useEffect(() => {
    if (isConnected && address) {
      setIsConnecting(false);
      setPendingError(null);
      // 连接钱包后自动登录后端
      loginToBackend(address);
    }
  }, [isConnected, address, loginToBackend]);

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-3 px-3 py-2 bg-dark-300/50 hover:bg-dark-300 rounded-xl border border-gray-800/50 hover:border-primary-500/30 transition-all"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-glow">
            <span className="text-xs font-bold text-white">
              {address.slice(2, 4).toUpperCase()}
            </span>
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-medium text-white">
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
            <div className="text-xs text-gray-400">
              {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : '...'}
            </div>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 mt-2 w-56 glass-card p-2 z-50">
              <div className="p-3 border-b border-gray-800/50 mb-2">
                <div className="text-xs text-gray-400 mb-1">已连接地址</div>
                <div className="text-sm font-medium text-white font-mono">
                  {address.slice(0, 10)}...{address.slice(-8)}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-emerald-400">已连接到 Sepolia</span>
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(address);
                }}
                className="w-full px-3 py-2.5 text-left text-gray-300 hover:bg-dark-100/50 rounded-lg transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                复制地址
              </button>
              <a
                href={`https://sepolia.etherscan.io/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-3 py-2.5 text-left text-gray-300 hover:bg-dark-100/50 rounded-lg transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                在 Etherscan 查看
              </a>
              <button
                onClick={() => {
                  disconnect();
                  api.logout();
                  setIsAuthenticated(false);
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2.5 text-left text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                断开连接
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  const buttonDisabled = isPending || isConnecting || isLoggingIn;

  // 获取钱包图标
  const getWalletIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('metamask')) {
      return (
        <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
          <path d="M36.3 3.8L22.2 14l2.6-6.2 11.5-4z" fill="#E2761B" stroke="#E2761B"/>
          <path d="M3.7 3.8l13.9 10.3-2.5-6.3L3.7 3.8z" fill="#E4761B" stroke="#E4761B"/>
          <path d="M31.1 27.2l-3.7 5.7 8 2.2 2.3-7.8-6.6-.1zM2.4 27.3l2.3 7.8 8-2.2-3.7-5.7-6.6.1z" fill="#E4761B" stroke="#E4761B"/>
          <path d="M12.3 17.1l-2.2 3.4 8 .4-.3-8.6-5.5 4.8zM27.7 17.1l-5.6-4.9-.2 8.7 8-.4-2.2-3.4z" fill="#E4761B" stroke="#E4761B"/>
          <path d="M10.4 32.9l4.8-2.3-4.2-3.2-.6 5.5zM24.8 30.6l4.8 2.3-.6-5.5-4.2 3.2z" fill="#E4761B" stroke="#E4761B"/>
          <path d="M29.6 32.9l-4.8-2.3.4 3.1-.1 1.3 4.5-2.1zM10.4 32.9l4.5 2.1-.1-1.3.4-3.1-4.8 2.3z" fill="#D7C1B3" stroke="#D7C1B3"/>
          <path d="M15 25.1l-4-1.2 2.9-1.3 1.1 2.5zM25 25.1l1.1-2.5 2.9 1.3-4 1.2z" fill="#233447" stroke="#233447"/>
          <path d="M10.4 32.9l.6-5.7-4.3.1 3.7 5.6zM29 27.2l.6 5.7 3.7-5.6-4.3-.1zM29.9 20.5l-8 .4.7 4.2 1.1-2.5 2.9 1.3 3.3-3.4zM11 23.9l2.9-1.3 1.1 2.5.7-4.2-8-.4 3.3 3.4z" fill="#CD6116" stroke="#CD6116"/>
          <path d="M10.1 20.5l3.5 6.7-.1-3.3-3.4-3.4zM26.6 23.9l-.1 3.3 3.4-6.7-3.3 3.4zM18.1 20.9l-.7 4.2.9 4.6.2-6.1-.4-2.7zM21.9 20.9l-.4 2.6.2 6.2.9-4.6-.7-4.2z" fill="#E4751F" stroke="#E4751F"/>
          <path d="M22.6 25.1l-.9 4.6.6.5 4.2-3.2.1-3.3-4 1.4zM11 23.9l.1 3.3 4.2 3.2.6-.5-.9-4.6-4-1.4z" fill="#F6851B" stroke="#F6851B"/>
          <path d="M22.7 35l.1-1.3-.4-.3h-4.8l-.4.3.1 1.3-4.5-2.1 1.6 1.3 3.2 2.2h4.9l3.2-2.2 1.6-1.3-4.6 2.1z" fill="#C0AD9E" stroke="#C0AD9E"/>
          <path d="M24.8 30.6l-.6-.5h-3.6l-.6.5-.4 3.1.4-.3h4.8l.4.3-.4-3.1z" fill="#161616" stroke="#161616"/>
          <path d="M37 14.7l1.2-5.8L36.3 3.8 24.8 12.5l5.6 4.9 8 2.3 1.8-2.1-.8-.6 1.2-1.1-.9-.7 1.2-.9-.8-.6zM1.8 8.9L3 14.7l-.8.6 1.2.9-.9.7 1.2 1.1-.8.6 1.8 2.1 8-2.3 5.6-4.9L6.7 3.8 1.8 8.9z" fill="#763D16" stroke="#763D16"/>
          <path d="M38.4 19.7l-8-2.3 2.4 3.4-3.4 6.7 4.5-.1h6.7l-2.2-7.7zM9.6 17.4l-8 2.3-2.2 7.8h6.6l4.5.1-3.4-6.7 2.5-3.5zM21.9 20.9l.5-8.6 2.3-6.2h-9.4l2.3 6.2.5 8.6.2 2.8v6.1h3.6l.2-6.1-.2-2.8z" fill="#F6851B" stroke="#F6851B"/>
        </svg>
      );
    }
    if (lowerName.includes('walletconnect')) {
      return (
        <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="8" fill="#3B99FC"/>
          <path d="M12.1 15.4c4.4-4.3 11.4-4.3 15.8 0l.5.5a.5.5 0 010 .8l-1.8 1.7a.3.3 0 01-.4 0l-.7-.7a7.8 7.8 0 00-11 0l-.8.8a.3.3 0 01-.4 0l-1.8-1.7a.5.5 0 010-.8l.6-.6zm19.5 3.6l1.6 1.6a.5.5 0 010 .8l-7.3 7.1a.6.6 0 01-.8 0l-5.2-5a.1.1 0 00-.2 0l-5.2 5a.6.6 0 01-.8 0l-7.3-7.1a.5.5 0 010-.8l1.6-1.6a.6.6 0 01.8 0l5.2 5a.1.1 0 00.2 0l5.2-5a.6.6 0 01.8 0l5.2 5a.1.1 0 00.2 0l5.2-5a.6.6 0 01.8 0z" fill="#fff"/>
        </svg>
      );
    }
    // 默认钱包图标
    return (
      <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    );
  };

  // 获取钱包描述
  const getWalletDescription = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('metamask') || lowerName.includes('injected')) {
      return '使用浏览器扩展连接';
    }
    if (lowerName.includes('walletconnect')) {
      return '扫码连接移动端钱包';
    }
    return '连接钱包';
  };

  return (
    <div className="relative">
      {/* 钱包选择模态框 */}
      {showWalletModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setShowWalletModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md glass-card p-6 z-50 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">选择钱包</h3>
              <button
                onClick={() => setShowWalletModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all group ${
                      isUnavailable
                        ? 'bg-dark-300/30 border-gray-700/30 hover:border-amber-500/50'
                        : 'bg-dark-300/50 hover:bg-dark-300 border-gray-800/50 hover:border-primary-500/50'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {getWalletIcon(connector.name)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`font-medium transition-colors ${
                        isUnavailable
                          ? 'text-gray-400 group-hover:text-amber-400'
                          : 'text-white group-hover:text-primary-400'
                      }`}>
                        {connector.name === 'Injected' ? 'MetaMask' : connector.name}
                        {isUnavailable && (
                          <span className="ml-2 text-xs text-amber-500">(未安装)</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {isUnavailable
                          ? '点击前往安装'
                          : getWalletDescription(connector.name)}
                      </div>
                    </div>
                    <svg className={`w-5 h-5 transition-colors ${
                      isUnavailable
                        ? 'text-gray-600 group-hover:text-amber-400'
                        : 'text-gray-500 group-hover:text-primary-400'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {isUnavailable ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      )}
                    </svg>
                  </button>
                );
              })}
            </div>

            <p className="mt-6 text-center text-sm text-gray-500">
              选择您常用的钱包进行连接
            </p>
          </div>
        </>
      )}

      <button
        onClick={handleConnect}
        disabled={buttonDisabled}
        className="btn-gradient disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {buttonDisabled ? (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {isLoggingIn ? '登录中...' : '连接中...'}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            连接钱包
          </span>
        )}
      </button>
      {pendingError && (
        <div className="absolute top-full right-0 mt-2 w-72 p-4 glass-card border-amber-500/30 z-50">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm text-amber-200">{pendingError}</p>
              <button
                onClick={() => setPendingError(null)}
                className="mt-2 text-xs text-amber-400 hover:text-amber-300 underline"
              >
                关闭提示
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
