import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function ReportViewer({
  isSec,
  report,
  report2,
}: {
  isSec: boolean;
  report: string;
  report2: string;
}) {
  // 控制是否顯示 Markdown
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 每次內容來源改變時先隱藏，再重新倒數 10 秒
    setShow(false);
    const timer = setTimeout(() => setShow(true), 10_000);
    return () => clearTimeout(timer); // 清理計時器，避免記憶體洩漏
  }, [isSec, report, report2]);

  return (
    <div
      style={{
        padding: "1rem",
        height: "82vh",
        overflowY: "auto",
      }}
    >
      {show ? (
        <ReactMarkdown>{isSec ? report2 : report}</ReactMarkdown>
      ) : (
        <p style={{ color: "#888" }}>載入中…</p>
      )}
    </div>
  );
}
