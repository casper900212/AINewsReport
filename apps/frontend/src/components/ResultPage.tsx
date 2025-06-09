import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import SearchPanel from "./SearchPanel";
import ChatApp from "./ChatApp";
import "../styles/ResultPage.css";
import { useProductionStore } from "../stores/useProductionStore";
import jsPDF from "jspdf";
import "../fonts/NotoSansTC";
import ResultCanva from "./ResultCanva";

export default function ResultPage() {
  const { historyId } = useParams<{ historyId: string }>();
  const [record, setRecord] = useState<any | null>(null);
  const [showSearchAnim, setShowSearchAnim] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [currentReply, setCurrentReply] = useState("");
  const [hasPosted, setHasPosted] = useState(false);
  const addProductionRecord = useProductionStore((state) => state.addProductionRecord);

  const handleExport = () => {
    if (!record) return;

    const doc = new jsPDF();
    doc.setFont("NotoSansTC");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("查詢結果報告", 20, 20);

    doc.setFontSize(12);
    const lineHeight = 10;
    let y = 35;

    const infoList = [
      ["關鍵字", record.keyword],
      ["類別", record.category],
      ["來源", record.source],
      [
        "查詢區間",
        Array.isArray(record.dateRange)
          ? `${record.dateRange[0]} ~ ${record.dateRange[1]}`
          : record.dateRange,
      ],
      ["筆數", record.limit?.toString()],
      ...(currentPrompt ? [["使用者 Prompt", currentPrompt]] : []),
    ];

    infoList.forEach(([label, value]) => {
      doc.text(`${label}：${value}`, 20, y);
      y += lineHeight;
    });

    doc.save("search_result.pdf");

    const newProductionRecord = {
      id: record.id,
      keyword: record.keyword,
      category: record.category,
      source: record.source,
      dateRange: record.dateRange,
      limit: record.limit,
      createdAt: new Date().toISOString(),
    };

    addProductionRecord(newProductionRecord);
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowSearchAnim(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (historyId) {
      fetch(`${import.meta.env.VITE_API_BASE}/history/${historyId}`)
        .then((res) => res.json())
        .then((res) => {
          setRecord(res.data);
        })
        .catch((err) => {
          console.error("讀取歷史紀錄失敗：", err);
        });
    }
  }, [historyId]);

  useEffect(() => {
    if (!record || !currentPrompt || !currentReply || hasPosted) {
      console.warn("❕ 條件不符或已送出，未送出 POST /history");
      return;
    }

    const conversation = `使用者：${currentPrompt}\n系統：${currentReply}`;
    const payload = {
      keyword: record.keyword,
      category: record.category,
      source: record.source,
      dateRange: record.dateRange,
      limit: record.limit,
      conversation,
    };

    fetch(`${import.meta.env.VITE_API_BASE}/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          console.log("歷史紀錄已儲存：", data);
          setHasPosted(true);
        } else {
          console.error("儲存歷史紀錄失敗（邏輯錯）:", data);
        }
      })
      .catch((err) => {
        console.error("儲存歷史紀錄失敗（連線錯）:", err);
      });
  }, [currentPrompt, currentReply, hasPosted, record]);

  if (!historyId || !record) {
    return <p style={{ padding: "1rem" }}>載入中...</p>;
  }

  return (
    <div className="result-page-container">
      <div className={`search-header ${showSearchAnim ? "animate" : ""}`}>
        <SearchPanel />
        <div className="crawler-updated-time">
          <span className="crawler-updated-time">
            最後更新時間：2025-06-02 14:00
          </span>
          <button className="export-button" onClick={handleExport}>
            匯出
          </button>
        </div>
      </div>

      <div className="result-layout">
        <div className="left-panel">
          <ChatApp
            historyId={historyId!}
            onPromptChange={(prompt) => setCurrentPrompt(prompt)}
            onReplyChange={(reply) => setCurrentReply(reply)}
          />
        </div>

        <div className="right-panel">
          <div className="result-content">
            <ResultCanva />
          </div>
        </div>
      </div>
    </div>
  );
}
