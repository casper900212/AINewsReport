import { useLocation, useParams } from "react-router-dom";
import { useFakeSearchStore } from "../stores/useFakeSearchStore";
import { useProductionStore } from "../stores/useProductionStore";

export default function ResultCanva() {
  const location = useLocation();
  const { id, historyId } = useParams<{ id?: string; historyId?: string }>();

  const isFromResult = location.pathname.startsWith("/history/");
  const targetId = isFromResult ? historyId : id;

  const historyRecord = useFakeSearchStore((state) =>
    state.getRecordById?.(targetId || "")
  );
  const productionRecord = useProductionStore((state) =>
    state.records.find((r) => r.id === targetId)
  );

  const record = isFromResult ? historyRecord : productionRecord;

  if (!record) return <p style={{ padding: "1rem" }}>找不到資料</p>;

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2>查詢結果報告</h2>
      <p><strong>關鍵字：</strong>{record.keyword}</p>
      <p><strong>類別：</strong>{record.category}</p>
      <p><strong>來源：</strong>{record.source}</p>
      <p>
        <strong>日期區間：</strong>
        {Array.isArray(record.dateRange)
          ? record.dateRange.join(" ~ ")
          : record.dateRange}
      </p>
      <p><strong>筆數：</strong>{record.limit}</p>
    </div>
  );
}
