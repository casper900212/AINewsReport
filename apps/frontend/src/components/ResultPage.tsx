import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    console.log("useEffect fired. historyId:", historyId);
    if (historyId) {
      if (historyId.startsWith("fake_")) {
        const fakeRecord = useFakeSearchStore
          .getState()
          .records.find((r) => r.id === historyId);
        if (fakeRecord) {
          console.log("✅ fakeRecord found:", fakeRecord);
          setRecord(fakeRecord);
        } else {
          console.warn("❌ 找不到假資料！");
        }
      } else {
        fetch(`${import.meta.env.VITE_API_BASE}/history/${historyId}`)
          .then((res) => res.json())
          .then((res) => {
            console.log("✅ API response:", res);
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
      <div className="result-layout">
        <div className="left-panel">
          <ChatApp
            historyId={historyId!}
            onPromptChange={(prompt) => setCurrentPrompt(prompt)}
            onReplyChange={() => {}} 
          />
        </div>
        <div className="right-panel">
          <ResultCanva
            record={record}
            currentPrompt={currentPrompt}
            addProductionRecord={addProductionRecord}
          />
        </div>
      </div>
    </div>
  );
}
