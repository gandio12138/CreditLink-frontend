import { ReactNode, memo, useEffect, useState } from 'react';
import Header from './Header';
import ParticleBackground from './ParticleBackground';
import { useModalStore } from '../../store/useStore';
import { DepositModal, WithdrawModal, BorrowModal, RepayModal } from '../modals';

interface LayoutProps {
  children: ReactNode;
}

// 背景组件使用 memo 避免不必要的重渲染
const Background = memo(function Background() {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    // 节流处理鼠标移动
    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        setMousePosition({ x, y });
        rafId = 0;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* 简化背景：只保留静态星空 */}
      <div className="stars-bg opacity-50" />

      {/* 粒子效果 - 已优化 */}
      <ParticleBackground />

      {/* 动态光球：跟随鼠标微移动，增加交互感 */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute w-96 h-96 bg-primary-500/10 rounded-full transition-transform duration-1000 ease-out"
          style={{
            left: `${mousePosition.x * 0.3 - 10}%`,
            top: `${mousePosition.y * 0.3 - 10}%`,
            filter: 'blur(60px)',
            transform: 'translate3d(0, 0, 0)',
          }}
        />
        <div
          className="absolute w-80 h-80 bg-accent-500/10 rounded-full transition-transform duration-1000 ease-out"
          style={{
            right: `${(100 - mousePosition.x) * 0.3 - 10}%`,
            bottom: `${(100 - mousePosition.y) * 0.3 - 10}%`,
            filter: 'blur(60px)',
            transform: 'translate3d(0, 0, 0)',
          }}
        />
      </div>
    </>
  );
});

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
      {/* 背景效果 */}
      <Background />

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
