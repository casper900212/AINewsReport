import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Sidebar.css';

export default function HistoryPanel({
  onSelect,
}: {
  onSelect: (item: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const historyItems = ['歷史紀錄1', '歷史紀錄2', '歷史紀錄3', '歷史紀錄4'];

  const handleClick = (item: string, index: number) => {
    onSelect(item);
    navigate(`/history${index + 1}`);
  };

  return (
    <div className="history-panel">
      <button className="sidebar-item" onClick={() => setExpanded(!expanded)}>
        歷史查詢
      </button>

      {expanded && (
        <div className="sidebar-sublist">
          {historyItems.map((item, index) => (
            <button
              key={index}
              className="sidebar-subitem"
              onClick={() => handleClick(item, index)} 
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
