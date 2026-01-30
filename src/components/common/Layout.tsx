import { ReactNode, useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useModalStore } from '../../store/useStore';
import { DepositModal, WithdrawModal, BorrowModal, RepayModal } from '../modals';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const {
    isDepositModalOpen,
    isWithdrawModalOpen,
    isBorrowModalOpen,
    isRepayModalOpen,
    depositAsset,
    withdrawAsset,
    borrowAsset,
    repayAsset,
    closeDepositModal,
    closeWithdrawModal,
    closeBorrowModal,
    closeRepayModal,
  } = useModalStore();

  const handleSidebarCollapse = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* 微弱背景装饰 */}
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />

      {/* 侧边栏 */}
      <Sidebar collapsed={sidebarCollapsed} onCollapse={handleSidebarCollapse} />

      {/* 顶部栏 */}
      <TopBar sidebarCollapsed={sidebarCollapsed} />

      {/* 主内容区域 */}
      <main
        className={`min-h-screen pt-16 transition-all duration-300 ${
          sidebarCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* 全局模态框 */}
      {isDepositModalOpen && depositAsset && (
        <DepositModal key={`deposit-${depositAsset}`} asset={depositAsset} onClose={closeDepositModal} />
      )}
      {isWithdrawModalOpen && withdrawAsset && (
        <WithdrawModal key={`withdraw-${withdrawAsset}`} asset={withdrawAsset} onClose={closeWithdrawModal} />
      )}
      {isBorrowModalOpen && borrowAsset && (
        <BorrowModal key={`borrow-${borrowAsset}`} asset={borrowAsset} onClose={closeBorrowModal} />
      )}
      {isRepayModalOpen && repayAsset && (
        <RepayModal key={`repay-${repayAsset}`} asset={repayAsset} onClose={closeRepayModal} />
      )}
    </div>
  );
}
