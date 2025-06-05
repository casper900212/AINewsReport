import { useState } from 'react';
import '../styles/Sidebar.css';

export default function SubscriptionPanel({
  onSelect,
}: {
  onSelect: (item: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const subscriptionItems = ['訂閱1', '訂閱2', '訂閱3', '訂閱4'];

  return (
    <div className="history-panel">
      {/* ✅ 主按鈕：不內縮 */}
      <button className="sidebar-item" onClick={() => setExpanded(!expanded)}>
        訂閱管理
      </button>

      {/* ✅ 子項清單：內縮樣式 */}
      {expanded && (
        <div className="sidebar-sublist">
          {subscriptionItems.map((item, index) => (
            <button
              key={index}
              className="sidebar-subitem"
              onClick={() => onSelect(item)}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
