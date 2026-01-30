import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Layout from './components/common/Layout';

// 路由懒加载 - 提升首屏加载性能
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Markets = lazy(() => import('./pages/Markets'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Borrow = lazy(() => import('./pages/Borrow'));
const Earn = lazy(() => import('./pages/Earn'));
const CreditProfile = lazy(() => import('./pages/CreditProfile'));

// 页面加载骨架屏
function PageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* 顶部统计 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
      {/* 内容骨架 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 skeleton h-80 rounded-xl" />
        <div className="skeleton h-80 rounded-xl" />
      </div>
    </div>
  );
}

function App() {
  return (
    <Layout>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/borrow" element={<Borrow />} />
          <Route path="/earn" element={<Earn />} />
          <Route path="/credit" element={<CreditProfile />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
