import { MdCancel } from "react-icons/md";
import jsPDF from "jspdf";
import "../fonts/NotoSansTC";

interface ResultCanvaProps {
  record: any;
  currentPrompt?: string;
  addProductionRecord?: (record: any) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function ResultCanva({
  record,
  currentPrompt,
  addProductionRecord,
  onToggleCollapse,
}: ResultCanvaProps) {
  const handleExport = () => {
    if (!record) return;
    const doc = new jsPDF();
    doc.setFont("NotoSansTC");
    doc.setFontSize(16);
    doc.text("查詢結果報告", 20, 20);
    let y = 35;
    const infoList = [
      ["關鍵字", record.keyword],
      ["類別", record.category],
      ["來源", record.source],
      [
        "查詢區間",record.startDate,
      ],
      ["筆數", record.limit?.toString()],
      ...(currentPrompt ? [["使用者 Prompt", currentPrompt]] : []),
    ];
    infoList.forEach(([label, value]) => {
      doc.text(`${label}：${value}`, 20, y);
      y += 10;
    });
    doc.save("search_result.pdf");
    if (addProductionRecord) {
      addProductionRecord({
        ...record,
        createdAt: new Date().toISOString(),
      });
    }
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
        最後爬蟲時間：2025-06-02 14:00
      </div>
    </div>
  );
}
