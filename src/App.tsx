import { Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState } from 'react';
import Layout from './components/common/Layout';

// 路由懒加载 - 提升首屏加载性能
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Markets = lazy(() => import('./pages/Markets'));
const Portfolio = lazy(() => import('./pages/Portfolio'));

// 页面加载骨架屏
function PageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero 骨架 */}
      <div className="skeleton h-48 w-full rounded-3xl" />
      {/* 统计卡片骨架 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-32 rounded-2xl" />
        ))}
      </div>
      {/* 内容骨架 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );
}

// 页面过渡动画包装器
function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState('fade-in');

  useEffect(() => {
    if (children !== displayChildren) {
      setTransitionStage('fade-out');
    }
  }, [children, displayChildren]);

  useEffect(() => {
    if (transitionStage === 'fade-out') {
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage('fade-in');
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [transitionStage, children]);

  return (
    <div
      key={location.pathname}
      className={`transition-all duration-300 ease-out ${
        transitionStage === 'fade-in'
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-2'
      }`}
    >
      {displayChildren}
    </div>
  );
}

function App() {
  return (
    <Layout>
      <Suspense fallback={<PageSkeleton />}>
        <PageTransition>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/markets" element={<Markets />} />
            <Route path="/portfolio" element={<Portfolio />} />
          </Routes>
        </PageTransition>
      </Suspense>
    </Layout>
  );
}

export default App;
