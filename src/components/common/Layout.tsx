import { ReactNode } from 'react';
import Header from './Header';
import ParticleBackground from './ParticleBackground';
import { useModalStore } from '../../store/useStore';
import { DepositModal, WithdrawModal, BorrowModal, RepayModal } from '../modals';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
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

  return (
    <div className="min-h-screen bg-dark-500 text-white overflow-hidden">
      {/* 星空背景 */}
      <div className="stars-bg" />

      {/* 极光效果 */}
      <div className="aurora" />

      {/* 网格背景 */}
      <div className="grid-bg" />

      {/* 粒子效果 */}
      <ParticleBackground />

      {/* 动态光球 */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* 左上角光球 */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] animate-pulse-slow" />
        {/* 右下角光球 */}
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent-500/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
        {/* 中央浮动光球 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary-500/10 via-transparent to-transparent rounded-full animate-float-slow" />
      </div>

      {/* Header */}
      <Header />

      {/* 主内容区域 */}
      <main className="container mx-auto px-4 pt-28 md:pt-24 pb-12 relative z-10">
        {children}
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
