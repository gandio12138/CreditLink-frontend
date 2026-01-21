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

  // 处理连接
  const handleConnect = useCallback(() => {
    if (isConnecting || isPending) return;
    setPendingError(null);
    setIsConnecting(true);
    connect({ connector: connectors[0] });
  }, [connect, connectors, isConnecting, isPending]);

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

  return (
    <div className="relative">
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
