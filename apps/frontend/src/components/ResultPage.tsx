import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { IoNewspaper } from "react-icons/io5";
import ChatApp from "./ChatApp";
import "../styles/ResultPage.css";
import { useProductionStore } from "../stores/useProductionStore";
import ResultCanva from "./ResultCanva";

export default function ResultPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [record, setRecord] = useState<any | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const addProductionRecord = useProductionStore(
    (state) => state.addProductionRecord
  );

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSec, setIsSec] = useState(false);
  const handleToggleCollapse = () => setIsCollapsed((prev) => !prev);
  const refetchConversation = () => {
    fetch(`http://localhost:3000/api/v1/conversations/${conversationId}`)
      .then((res) => res.json())
      .then((res) => {
        console.log("資料更新成功", res);
        setRecord(res.data);
      })
      .catch((err) => console.error("重新載入對話失敗", err));
  };

  useEffect(() => {
    if (conversationId && conversationId !== "undefined") {
      fetch(`http://localhost:3000/api/v1/conversations/${conversationId}`)
        .then((res) => res.json())
        .then((res) => {
          console.log("對話內容載入成功", res);
          setRecord(res.data);
        })
        .catch((err) => {
          console.error("載入對話失敗：", err);
        });
    }
  }, [conversationId]);

  if (!conversationId || !record) {
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
            conversationId={conversationId}
            messages={record.messages.filter(
              (msg: any) => msg.role === "user" || msg.role === "assistant"
            )} 
            onPromptChange={(prompt) => setCurrentPrompt(prompt)}
            onReplyChange={refetchConversation}
            setting={setIsSec}
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
            conversationId={Number(conversationId)}
            isSec={isSec}
          />
        </div>

        {/* 展開按鈕 */}
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
