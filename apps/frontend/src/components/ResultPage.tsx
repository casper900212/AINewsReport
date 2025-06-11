import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { IoNewspaper } from "react-icons/io5";
import ChatApp from "./ChatApp";
import "../styles/ResultPage.css";
import { useProductionStore } from "../stores/useProductionStore";
import { useFakeSearchStore } from "../stores/useFakeSearchStore";
import ResultCanva from "./ResultCanva";

export default function ResultPage() {
  const { historyId } = useParams<{ historyId: string }>();
  const [record, setRecord] = useState<any | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const addProductionRecord = useProductionStore(
    (state) => state.addProductionRecord
  );

  const [isCollapsed, setIsCollapsed] = useState(false);
  const handleToggleCollapse = () => setIsCollapsed((prev) => !prev);

  useEffect(() => {
    if (historyId) {
      const localRecord = useFakeSearchStore
        .getState()
        .records.find((r) => r.id === historyId);
  
      if (localRecord) {
        setRecord(localRecord);
      } else {
        fetch(`${import.meta.env.VITE_API_BASE}/history/${historyId}`)
          .then((res) => res.json())
          .then((res) => {
            setRecord(res.data);
          })
          .catch((err) => {
            console.error("讀取歷史紀錄失敗：", err);
          });
      }
    }
  }, [historyId]);

  if (!historyId || !record) {
    return <p style={{ padding: "1rem" }}>載入中...</p>;
  }

  return (
    <div className="result-page-container">
      <div
        className="result-layout"
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
        }}
      >
        {/* 左側 ChatApp */}
        <div
          className="left-panel"
          style={{
            flex: 1,
            marginRight: isCollapsed ? "0px" : "700px",
            transition: "margin-right 0.3s ease",
          }}
        >
          <ChatApp
            historyId={historyId!}
            onPromptChange={(prompt) => setCurrentPrompt(prompt)}
            onReplyChange={() => {}}
          />
        </div>

        {/* 右側報告面板 */}
        <div
          className="right-panel"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "700px",
            height: "100%",
            zIndex: 1000,
            transform: isCollapsed ? "translateX(100%)" : "translateX(0%)",
            transition: "transform 0.5s ease",
          }}
        >
          <ResultCanva
            record={record}
            currentPrompt={currentPrompt}
            addProductionRecord={addProductionRecord}
            isCollapsed={isCollapsed}
            onToggleCollapse={handleToggleCollapse}
          />
        </div>

        {/* 收合狀態下的展開按鈕 */}
        {isCollapsed && (
          <button
            onClick={handleToggleCollapse}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              zIndex: 1100,
            }}
          >
            <IoNewspaper size={24} color="#315881" />
          </button>
        )}
      </div>
    </div>
  );
}
