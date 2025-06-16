import { useState } from 'react';
import Sidebar from './components/Sidebar';
import SearchPanel from './components/SearchPanel';
import { FaAngleRight } from 'react-icons/fa';
import { Routes, Route } from 'react-router-dom';
import ResultPage from './components/ResultPage';
import SubscriptionPage from './pages/SubscriptionPage';
import ProductionPage from './pages/ProductionPage';

function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', position: 'relative' }}>
      {/* Sidebar 區塊 */}
      <div
        style={{
          width: collapsed ? 0 : 240,
          transition: 'width 0.3s',
          overflow: 'hidden',
          flexShrink: 0,
          background: '#f9f9f9',
        }}
      >
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(true)} />
      </div>

      {/* 展開 Sidebar 按鈕 */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          style={{
            position: 'absolute',
            top: '1rem',
            left: '0.5rem',
            zIndex: 1000,
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          <FaAngleRight size={20} />
        </button>
      )}

      {/* 主內容區 */}
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<SearchPanel />} />
          <Route path="/conversations/:conversationId" element={<ResultPage />} />
          <Route path="/subscriptions" element={<SubscriptionPage />} />
          <Route path="/produce/:id" element={<ProductionPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;