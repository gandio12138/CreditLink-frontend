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
      const nonceResult = await api.getNonce(walletAddress);
      if (nonceResult.error || !nonceResult.data) {
        setPendingError('获取登录凭证失败');
        return;
      }

      const { message } = nonceResult.data;
      const signature = await signMessageAsync({ message });

      const loginResult = await api.login(walletAddress, signature, message);
      if (loginResult.error || !loginResult.data) {
        setPendingError('登录失败');
        return;
      }

      setIsAuthenticated(true);
    } catch {
      setPendingError('签名被取消或出错');
    } finally {
      setIsLoggingIn(false);
    }
  }, [isLoggingIn, signMessageAsync, setIsAuthenticated]);

  const handleConnect = useCallback(() => {
    if (isConnecting || isPending) return;
    setPendingError(null);
    setShowWalletModal(true);
  }, [isConnecting, isPending]);

  const hasInjectedWallet = typeof window !== 'undefined' && window.ethereum;

  const handleSelectWallet = useCallback((connector: typeof connectors[number]) => {
    if ((connector.name === 'Injected' || connector.name.toLowerCase().includes('metamask')) && !hasInjectedWallet) {
      window.open('https://metamask.io/download/', '_blank');
      setPendingError('请先安装 MetaMask 浏览器扩展');
      setShowWalletModal(false);
      return;
    }
    setIsConnecting(true);
    setShowWalletModal(false);
    connect({ connector });
  }, [connect, hasInjectedWallet]);

  useEffect(() => {
    if (isConnected && address) {
      setIsConnecting(false);
      setPendingError(null);
      loginToBackend(address);
    }
  }, [isConnected, address, loginToBackend]);

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-3 px-3 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-all"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {address.slice(2, 4).toUpperCase()}
            </span>
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-medium text-slate-100">
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
            <div className="text-xs text-slate-500">
              {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : '...'}
            </div>
          </div>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
            <div className="absolute right-0 mt-2 w-56 bg-surface rounded-xl border border-slate-700/50 p-2 z-50 shadow-xl animate-fade-in">
              <div className="p-3 border-b border-slate-700/50 mb-2">
                <div className="text-xs text-slate-500 mb-1">已连接地址</div>
                <div className="text-sm font-medium text-slate-100 font-mono">
                  {address.slice(0, 10)}...{address.slice(-8)}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-2 h-2 rounded-full bg-success-500" />
                  <span className="text-xs text-success-400">Sepolia</span>
                </div>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(address)}
                className="w-full px-3 py-2.5 text-left text-slate-300 hover:bg-slate-800/50 rounded-lg transition-colors flex items-center gap-3"
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
                className="w-full px-3 py-2.5 text-left text-slate-300 hover:bg-slate-800/50 rounded-lg transition-colors flex items-center gap-3"
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
                className="w-full px-3 py-2.5 text-left text-danger-400 hover:bg-danger-500/10 rounded-lg transition-colors flex items-center gap-3"
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

  return (
    <div className="relative">
      {/* 钱包选择模态框 */}
      {showWalletModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowWalletModal(false)} />
          <div className="modal-content p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-100">选择钱包</h3>
              <button
                onClick={() => setShowWalletModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        ? 'bg-slate-800/30 border-slate-700/30 hover:border-warning-500/50'
                        : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/50 hover:border-primary-500/50'
                    }`}
                  >
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                      {connector.name.toLowerCase().includes('walletconnect') ? (
                        <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
                          <rect width="40" height="40" rx="8" fill="#3B99FC"/>
                          <path d="M12.1 15.4c4.4-4.3 11.4-4.3 15.8 0l.5.5a.5.5 0 010 .8l-1.8 1.7a.3.3 0 01-.4 0l-.7-.7a7.8 7.8 0 00-11 0l-.8.8a.3.3 0 01-.4 0l-1.8-1.7a.5.5 0 010-.8l.6-.6zm19.5 3.6l1.6 1.6a.5.5 0 010 .8l-7.3 7.1a.6.6 0 01-.8 0l-5.2-5a.1.1 0 00-.2 0l-5.2 5a.6.6 0 01-.8 0l-7.3-7.1a.5.5 0 010-.8l1.6-1.6a.6.6 0 01.8 0l5.2 5a.1.1 0 00.2 0l5.2-5a.6.6 0 01.8 0l5.2 5a.1.1 0 00.2 0l5.2-5a.6.6 0 01.8 0z" fill="#fff"/>
                        </svg>
                      ) : (
                        <svg className={`w-8 h-8 ${isUnavailable ? 'text-slate-500' : 'text-primary-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`font-medium transition-colors ${
                        isUnavailable
                          ? 'text-slate-400 group-hover:text-warning-400'
                          : 'text-slate-100 group-hover:text-primary-400'
                      }`}>
                        {connector.name === 'Injected' ? 'MetaMask' : connector.name}
                        {isUnavailable && (
                          <span className="ml-2 text-xs text-warning-500">(未安装)</span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500">
                        {isUnavailable
                          ? '点击前往安装'
                          : connector.name.toLowerCase().includes('walletconnect')
                            ? '扫码连接移动端钱包'
                            : '使用浏览器扩展连接'}
                      </div>
                    </div>
                    <svg className={`w-5 h-5 ${
                      isUnavailable ? 'text-slate-600' : 'text-slate-500'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </div>

            <p className="mt-6 text-center text-sm text-slate-500">
              选择您常用的钱包进行连接
            </p>
          </div>
        </>
      )}

      <button
        onClick={handleConnect}
        disabled={buttonDisabled}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="absolute top-full right-0 mt-2 w-72 p-4 bg-surface rounded-xl border border-warning-500/30 z-50 shadow-xl">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-warning-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm text-warning-300">{pendingError}</p>
              <button
                onClick={() => setPendingError(null)}
                className="mt-2 text-xs text-warning-400 hover:text-warning-300 underline"
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
