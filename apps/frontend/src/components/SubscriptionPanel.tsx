import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';

export default function SubscriptionPanel() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = location.pathname === '/subscriptions';

  return (
    <div className="history-panel">
      <button
        className={`sidebar-item ${isActive ? 'active' : ''}`}
        onClick={() => navigate('/subscriptions')}
      >
        訂閱管理
      </button>
    </div>
  );
}
