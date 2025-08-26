import { FaChevronLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../styles/Sidebar.css";
import HistoryPanel from "./HistoryPanel";
import ProducePanel from "./ProducePanel";
import SubscriptionPanel from "./SubscriptionPanel";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  historyRefreshKey: number; // ✅ 正確接收從 App 傳進來的 key
}

export default function Sidebar({
  collapsed,
  onToggle,
  historyRefreshKey,
}: SidebarProps) {
  const navigate = useNavigate();

  const handleHistorySelect = (label: string) => {
    console.log("選擇歷史紀錄:", label);
  };

  const handleOrderSelect = (label: string) => {
    console.log("選擇產製紀錄:", label);
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {!collapsed && (
        <>
          {/* 收合按鈕 */}
          <div className="sidebar-header">
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                textAlign: "center",
                height: "4.8vh",
                fontSize: "20px",
              }}
            >
              你 RAG 了嗎？
            </div>
            <button className="sidebar-collapse-button" onClick={onToggle}>
              <FaChevronLeft size={16} />
            </button>
          </div>

          {/* 功能清單 */}
          <div className="sidebar-section">
            <button className="sidebar-item" onClick={() => navigate("/")}>
              新查詢
            </button>

            {/* ✅ 傳入 refreshKey 給 HistoryPanel */}
            <HistoryPanel
              onSelect={handleHistorySelect}
              refreshKey={historyRefreshKey}
            />

            <SubscriptionPanel />
            <ProducePanel onSelect={handleOrderSelect} />
          </div>
        </>
      )}
    </div>
  );
}
