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
      {/* 简化背景：只保留静态星空和粒子效果 */}
      <div className="stars-bg opacity-60" />

      {/* 粒子效果 - 已优化 */}
      <ParticleBackground />

      {/* 简化光球：减少为2个，使用CSS而非动画 */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary-500/15 rounded-full blur-[80px]" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-accent-500/15 rounded-full blur-[80px]" />
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
