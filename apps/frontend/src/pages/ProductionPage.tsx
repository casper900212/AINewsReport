import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function ProductionPage() {
  const { id } = useParams();
  const [record, setRecord] = useState<any | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");

  useEffect(() => {
    // 找出 productionRecord 中符合 id 的那一筆
    const stored = localStorage.getItem("productionRecords");
    if (stored) {
      const parsed = JSON.parse(stored);
      const matched = parsed.find((r: any) => r.id === id);
      setRecord(matched);
    }
  }, [id]);

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

  if (!record) {
    return <div style={{ padding: "1rem" }}>找不到資料</div>;
  }

  return (
    <div style={{ background: "#fff", padding: "1rem", position: "relative", minHeight: "900px" , textAlign: "center"}}>
      <h2>查詢結果報告</h2>  
  <div
      style={{
        position: "absolute",
        bottom: "1rem",
        right: "1rem",
        fontSize: "0.9rem",
        color: "#555",
        textAlign: "right",
      }}
    >
      {record.createdAt && (
        <p style={{ margin: 0 }}>
          建立時間：{new Date(record.createdAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false })}
        </p>
      )}
      <p style={{ margin: 0 }}>最後爬蟲時間：{lastUpdatedTime}</p>
    </div>
  </div>
);
  
}
