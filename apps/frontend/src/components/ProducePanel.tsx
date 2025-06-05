import { useState } from 'react';
import '../styles/Sidebar.css';

export default function ProducePanel({
  onSelect,
}: {
  onSelect: (item: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const produceItems = ['產製紀錄1', '產製紀錄2', '產製紀錄3', '產製紀錄4'];

  return (
    <div className="history-panel">
      {/* ✅ 主按鈕：不內縮 */}
      <button className="sidebar-item" onClick={() => setExpanded(!expanded)}>
        產製紀錄
      </button>

      {/* ✅ 子項清單：內縮樣式 */}
      {expanded && (
        <div className="sidebar-sublist">
          {produceItems.map((item, index) => (
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
