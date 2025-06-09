import jsPDF from "jspdf";
import "../fonts/NotoSansTC";

interface ResultCanvaProps {
  record: any;
  currentPrompt?: string;
  addProductionRecord?: (record: any) => void;
}

export default function ResultCanva({
  record,
  currentPrompt,
  addProductionRecord,
}: ResultCanvaProps) {
  console.log("🔍 ResultCanva rendered with record:", record);

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
      ["關鍵字", record.query || record.keyword],
      ["類別", record.category],
      ["來源", record.source],
      [
        "查詢區間",
        Array.isArray(record.dateRange)
          ? `${record.dateRange[0]} ~ ${record.dateRange[1]}`
          : record.dateRange || `${record.startDate} ~ ${record.endDate}`,
      ],
      ["筆數", record.limit?.toString()],
      ...(currentPrompt ? [["使用者 Prompt", currentPrompt]] : []),
    ];

    infoList.forEach(([label, value]) => {
      doc.text(`${label}：${value}`, 20, y);
      y += lineHeight;
    });

    doc.save("search_result.pdf");

    if (addProductionRecord) {
      const newProductionRecord = {
        id: record.id,
        keyword: record.query || record.keyword,
        category: record.category,
        source: record.source,
        dateRange: record.dateRange || `${record.startDate} ~ ${record.endDate}`,
        limit: record.limit,
        createdAt: new Date().toISOString(),
      };
      addProductionRecord(newProductionRecord);
    }
  };

  return (
    <div className="result-inner">
      <div className="result-header">
        <h2>查詢結果報告</h2>
        <button
          className="export-button"
          onClick={(e) => {
            console.log("Button clicked");
            handleExport();
          }}
          style={{ zIndex: 10, position: "relative" }}
        >
          匯出
        </button>
      </div>

      {"keyword" in record && (
        <p>
          <strong>關鍵字：</strong>
          {record.keyword ?? "(無)"}
        </p>
      )}
      {"category" in record && (
        <p>
          <strong>類別：</strong>
          {record.category ?? "(無)"}
        </p>
      )}
      {"source" in record && (
        <p>
          <strong>來源：</strong>
          {record.source ?? "(無)"}
        </p>
      )}
      {"dateRange" in record && (
        <p>
          <strong>日期區間：</strong>
          {Array.isArray(record.dateRange)
            ? record.dateRange.join(" ~ ")
            : record.dateRange ?? "(無)"}
        </p>
      )}
      {"limit" in record && (
        <p>
          <strong>筆數：</strong>
          {record.limit ?? "(無)"}
        </p>
      )}

      <div className="updated-time">最後爬蟲時間：2025-06-02 14:00</div>
    </div>
  );
}
