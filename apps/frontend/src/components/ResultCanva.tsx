import { useState, useEffect } from "react";
import { MdCancel } from "react-icons/md";
import jsPDF from "jspdf";
import "../fonts/NotoSansTC";

interface ResultCanvaProps {
  record: any;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  addProductionRecord: (record: any) => void;
  conversationId: number;
}

type Msg = { role: string; content: string };

export default function ResultCanva({
  record,
  onToggleCollapse,
  conversationId,
}: ResultCanvaProps) {
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");
  const [conversationMessages, setConversationMessages] = useState<Msg[]>([]);

  /* 取得最後一次爬蟲更新時間 */
  useEffect(() => {
    fetch("http://localhost:3000/api/v1/vdb-update/latest", {
      headers: { Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((d) => {
        const updatedAt = d?.data?.updatedAt;
        setLastUpdatedTime(
          updatedAt
            ? new Date(updatedAt).toLocaleString("zh-TW", {
                timeZone: "Asia/Taipei",
                hour12: false,
              })
            : "尚無更新紀錄"
        );
      })
      .catch((e) => {
        console.error("取得最後更新時間失敗：", e);
        setLastUpdatedTime("載入失敗");
      });
  }, []);

  /* 取得整段對話訊息 */
  useEffect(() => {
    fetch(`http://localhost:3000/api/v1/conversations/${conversationId}`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((d) => {
        const msgs: Msg[] | undefined = d?.data?.messages; // 改這裡
        if (Array.isArray(msgs)) setConversationMessages(msgs);
      })
      .catch((e) => console.error("載入對話內容失敗：", e));
  }, [conversationId]);

  /* 取最後一筆 human 回覆 */
  const humanResponse =
    conversationMessages
      .slice()
      .reverse()
      .find((m) => m.role === "human")?.content ?? "";

  /* 匯出 PDF */
  const handleExport = () => {
    if (!record) return;

    /* 更新 localStorage */
    const id = record.id || Math.random().toString(36).substring(2, 10);
    const newRecord = { ...record, id, createdAt: new Date().toISOString() };
    const stored = JSON.parse(localStorage.getItem("productionRecords") || "[]");
    localStorage.setItem(
      "productionRecords",
      JSON.stringify([newRecord, ...stored.filter((r: any) => r.id !== id)])
    );

    /* 產出 PDF */
    const doc = new jsPDF();
    doc.setFont("NotoSansTC");
    doc.setFontSize(16);
    doc.text("查詢結果報告", 20, 20);

    const infoList: [string, string][] = [
      ["查詢結果", humanResponse || "尚無查詢結果"],
    ];

    let y = 35;
    infoList.forEach(([label, value]) => {
      doc.text(`${label}：${value}`, 20, y);
      y += 10;
    });

    doc.save("search_result.pdf");
  };

  return (
    <div
      className="result-inner"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "#fff",
        overflow: "hidden",
      }}
    >
      {/* 標題列 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.5rem 1rem",
          borderBottom: "1px solid #ddd",
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          style={{ background: "transparent", border: "none", cursor: "pointer" }}
        >
          <MdCancel size={24} color="#315881" />
        </button>
        <h2 style={{ margin: 0, fontSize: "1.2rem" }}>查詢結果報告</h2>
        <button className="export-button" onClick={handleExport}>
          匯出
        </button>
      </div>

      {/* 查詢結果區塊 */}
      <div style={{ padding: "1rem" }}>
        <p>
          <strong>查詢結果：</strong>
        </p>
        <p style={{ whiteSpace: "pre-wrap" }}>
          {humanResponse || "尚無查詢結果"}
        </p>
      </div>

      {/* 資料最新時間 */}
      <div className="updated-time" style={{ padding: "0 1rem 1rem" }}>
        資料最新時間：{lastUpdatedTime}
      </div>
    </div>
  );
}
