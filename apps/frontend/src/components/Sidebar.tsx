import '../styles/Sidebar.css';
import HistoryPanel from './HistoryPanel';
import SubscriptionPanel from './SubscriptionPanel';
import ProducePanel from './ProducePanel';
import { FaChevronLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();

  const handleHistorySelect = (label: string) => {
    console.log('選擇歷史紀錄:', label);
  };

  const handleOrderSelect = (label: string) => {
    console.log('選擇產製紀錄:', label);
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {!collapsed && (
        <>
          {/* 🔼 收合按鈕放最上面 */}
          <div className="sidebar-header">
            <button className="sidebar-collapse-button" onClick={onToggle}>
              <FaChevronLeft size={16} />
            </button>
          </div>

          {/* 功能清單 */}
          <div className="sidebar-section">
            <button
              className="sidebar-item"
              onClick={() => navigate('/')}
            >
              新查詢
            </button>
            <HistoryPanel onSelect={handleHistorySelect} />
            <SubscriptionPanel />
            <ProducePanel onSelect={handleOrderSelect} />
          </div>
        </>
      )}
    </div>
  );
}
