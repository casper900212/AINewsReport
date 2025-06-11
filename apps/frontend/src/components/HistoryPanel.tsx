import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFakeSearchStore } from "../stores/useFakeSearchStore";
import "../styles/Sidebar.css";
import { MdDelete } from "react-icons/md";

export default function HistoryPanel({
  onSelect,
}: {
  onSelect: (item: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { records, deleteRecordById } = useFakeSearchStore();

  const handleClick = (id: string) => {
    onSelect(id);
    navigate(`/history/${id}`);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("確定要刪除這筆紀錄嗎？")) {
      deleteRecordById(id);

      const currentPathMatch = location.pathname.match(/^\/result\/([^/]+)$/);
      const currentId = currentPathMatch?.[1];
      if (currentId === id) {
        navigate("/");
      }
    }
  };

  return (
    <div className="history-panel">
      <button className="sidebar-item" onClick={() => setExpanded(!expanded)}>
        歷史查詢
      </button>

      {expanded && (
        <div className="sidebar-sublist">
          {records.map((record) => (
            <div key={record.id} className="sidebar-subitem-wrapper">
              <button
                className="sidebar-subitem"
                onClick={() => handleClick(record.id)}
              >
                <div className="item-info">
                  來源：{record.source}｜關鍵字：{record.keyword}
                  <div className="item-date">{record.startDate}</div>
                </div>
              </button>
              <button
                className="sidebar-delete-button"
                onClick={(e) => handleDelete(e, record.id)}
              >
                <MdDelete />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
