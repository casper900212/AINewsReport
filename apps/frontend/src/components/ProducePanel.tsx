import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProductionStore } from "../stores/useProductionStore";
import { MdDelete } from "react-icons/md";
import "../styles/Sidebar.css";

export default function ProducePanel() {
  const [expanded, setExpanded] = useState(false);
  const records = useProductionStore((state) => state.records);
  const deleteRecord = useProductionStore(
    (state) => state.deleteProductionRecord
  );
  const navigate = useNavigate();

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("確定要刪除這筆產製紀錄嗎？")) {
      deleteRecord(id);
    }
  };

  const handleClick = (id: string) => {
    navigate(`/produce/${id}`); // ✅ 改成 produce
  };

  return (
    <div className="history-panel">
      <button className="sidebar-item" onClick={() => setExpanded(!expanded)}>
        產製紀錄
      </button>

      {expanded && (
        <div className="sidebar-sublist">
          {records.map((r) => (
            <div key={r.id} className="sidebar-subitem-wrapper">
              <button
                className="sidebar-subitem"
                onClick={() => handleClick(r.id)}
              >
                <div className="item-info">
                來源：{r.source}｜關鍵字：{r.keyword}
                </div>
                <div className="item-date">
                  {Array.isArray(r.dateRange)
                    ? `${r.dateRange[0]} ~ ${r.dateRange[1]}`
                    : r.dateRange}
                </div>
              </button>
              <button
                className="sidebar-delete-button"
                onClick={(e) => handleDelete(e, r.id)}
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
