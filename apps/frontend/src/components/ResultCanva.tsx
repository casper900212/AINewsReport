import { useState, useEffect } from "react";
import { MdCancel } from "react-icons/md";
import jsPDF from "jspdf";
import "../fonts/NotoSansTC";

interface ResultCanvaProps {
  record: any;
  currentPrompt?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function ResultCanva({
  record,
  currentPrompt,
  onToggleCollapse,
}: ResultCanvaProps) {
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");

  useEffect(() => {
    fetch("http://localhost:3000/api/v1/vdb-update/latest", {
      headers: { Accept: "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        const updatedAt = data?.data?.updatedAt;
        if (updatedAt) {
          const formatted = new Date(updatedAt).toLocaleString("zh-TW", {
            timeZone: "Asia/Taipei",
            hour12: false,
          });
          setLastUpdatedTime(formatted);
        } else {
          setLastUpdatedTime("尚無更新紀錄");
        }
      })
      .catch((err) => {
        console.error("取得最後更新時間失敗：", err);
        setLastUpdatedTime("載入失敗");
      });
  }, []);

  const handleExport = () => {
    if (!record) return;

    const id = record.id || Math.random().toString(36).substring(2, 10);
    const newRecord = {
      ...record,
      id,
      createdAt: new Date().toISOString(),
    };

    // 儲存到 localStorage
    const old = JSON.parse(localStorage.getItem("productionRecords") || "[]");
    const updated = [newRecord, ...old.filter((r: any) => r.id !== id)];
    localStorage.setItem("productionRecords", JSON.stringify(updated));

    // 匯出 PDF
    const doc = new jsPDF();
    doc.setFont("NotoSansTC");
    doc.setFontSize(16);
    doc.text("查詢結果報告", 20, 20);

    let y = 35;
    const infoList = [
      ["關鍵字", newRecord.keyword],
      ["類別", newRecord.category],
      ["來源", newRecord.source],
      ["查詢區間", newRecord.startDate],
      ["筆數", newRecord.limit?.toString()],
      ...(currentPrompt ? [["使用者 Prompt", currentPrompt]] : []),
      ["最後爬蟲時間", lastUpdatedTime || "尚無資料"],
    ];
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
      <div
        className="result-header"
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
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <MdCancel size={24} color="#315881" />
        </button>
        <h2 style={{ margin: 0, fontSize: "1.2rem" }}>查詢結果報告</h2>
        <button className="export-button" onClick={handleExport}>
          匯出
        </button>
      </div>

      <div style={{ padding: "1rem" }}>
        {"keyword" in record && (
          <p>
            <strong>關鍵字：</strong> {record.keyword}
          </p>
        )}
        {"category" in record && (
          <p>
            <strong>類別：</strong> {record.category}
          </p>
        )}
        {"source" in record && (
          <p>
            <strong>來源：</strong> {record.source}
          </p>
        )}
        {"startDate" in record && (
          <p>
            <strong>日期區間：</strong> {record.startDate}
          </p>
        )}
        {"limit" in record && (
          <p>
            <strong>筆數：</strong> {record.limit}
          </p>
        )}
      </div>

      <div className="updated-time" style={{ padding: "0 1rem 1rem" }}>
        最後爬蟲時間：{lastUpdatedTime}
      </div>
    </div>
  );
}
