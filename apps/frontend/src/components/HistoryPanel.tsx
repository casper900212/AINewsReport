import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Sidebar.css";
import { MdDelete } from "react-icons/md";

interface HistoryPanelProps {
  onSelect: (item: string) => void;
  refreshKey: number;
}

export default function HistoryPanel({ onSelect, refreshKey }: HistoryPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3000/api/v1/conversations");
      const data = await res.json();
      const sorted = (data.data || []).sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAllRecords(sorted);
    } catch (err) {
      console.error("無法取得對話列表", err);
    }
  }, []);

  // ✅ 每當 refreshKey 改變且展開狀態為 true，就重新 fetch
  useEffect(() => {
    if (expanded) {
      fetchConversations();
    }
  }, [refreshKey, expanded, fetchConversations]);

  const handleClick = (id: string) => {
    onSelect(id);
    navigate(`/conversations/${id}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    if (!window.confirm("確定要刪除這筆紀錄嗎？")) return;

    try {
      const res = await fetch(`http://localhost:3000/api/v1/conversations/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error("刪除失敗");
      }

      setAllRecords((prev) => prev.filter((r) => r.id !== id));

      const match = location.pathname.match(/^\/conversations\/([^/]+)$/);
      const currentId = match?.[1];
      if (currentId === id) {
        navigate("/");
      }
    } catch (err) {
      console.error("無法刪除對話紀錄：", err);
      alert("刪除失敗，請稍後再試");
    }
  };

  return (
    <div className="history-panel">
      <button
        className="sidebar-item"
        onClick={() => {
          setExpanded((prev) => {
            const next = !prev;
            if (!prev) fetchConversations(); // 第一次展開就 fetch
            return next;
          });
        }}
      >
        歷史查詢
      </button>

      {expanded && (
        <div className="sidebar-sublist">
          {allRecords.length === 0 ? (
            <div className="sidebar-subitem" style={{ padding: "1rem" }}>
              尚無歷史紀錄
            </div>
          ) : (
            allRecords.map((record) => (
              <div key={record.id} className="sidebar-subitem-wrapper">
                <button className="sidebar-subitem" onClick={() => handleClick(record.id)}>
                  <div className="item-info">{record.title || "未命名查詢"}</div>
                </button>
                <button
                  className="sidebar-delete-button"
                  onClick={(e) => handleDelete(e, record.id)}
                >
                  <MdDelete />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
