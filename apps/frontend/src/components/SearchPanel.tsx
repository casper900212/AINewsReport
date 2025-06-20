import { useState, useEffect } from "react";
import Select from "react-select";
import "../styles/SearchPanel.css";
import { useNavigate } from "react-router-dom";

export default function SearchPanel({
  onSearchComplete,
}: {
  onSearchComplete?: () => void;
}) {
  const industryOptions = [
    { value: "資安", label: "資安" },
    { value: "人工智慧", label: "人工智慧" },
    { value: "區塊鏈", label: "區塊鏈" },
  ];

  const [industry, setindustry] = useState<any[]>([]);
  const [sourceOptions, setSourceOptions] = useState<any[]>([]);
  const [source, setSource] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState<string>("");
  const [sourceError, setSourceError] = useState(false);
  const [limitError, setLimitError] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  const navigate = useNavigate();

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
        }
      })
      .catch((err) => {
        console.error("取得最後更新時間失敗：", err);
      });
  }, []);

  useEffect(() => {
    fetch("http://localhost:3000/api/v1/crawler", {
      headers: { Accept: "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.data
          .filter((c: any) => c.enabled)
          .map((c: any) => ({
            value: c.scriptFilename.replace(".py", ""),
            label: c.name,
          }));
        setSourceOptions(mapped);
        if (mapped.length === 1) setSource([mapped[0]]);
      })
      .catch((err) => console.error("來源清單載入失敗：", err));
  }, []);

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - i;
    return { value: year, label: `${year}年` };
  });

  const maxMonth = selectedYear === currentYear ? currentMonth : 12;
  const monthOptions = Array.from({ length: maxMonth }, (_, i) => {
    const month = i + 1;
    return { value: month, label: `${month}月` };
  });

  useEffect(() => {
    if (selectedMonth > maxMonth) {
      setSelectedMonth(maxMonth);
    }
  }, [selectedYear]);

  const startMonth = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

  const handleSearch = async () => {
    const isSourceEmpty = source.length === 0;
    const numericLimit = Number(limit);
    const isLimitInvalid = !limit || isNaN(numericLimit) || numericLimit < 1 || numericLimit > 10;

    setSourceError(isSourceEmpty);
    setLimitError(isLimitInvalid);

    if (isSourceEmpty || isLimitInvalid) return;

    setAnimating(true);

    try {
      const formattedindustry = industry.map((c: any) => c.value);
      const formattedSource = source.map((s: any) => s.value);

      const response = await fetch("http://localhost:3000/api/v1/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          filters: {
            industry: formattedindustry[0] || undefined,
            keywords: query ? query.split(/\s+/) : [],
            source: formattedSource,
            dateRange: [startMonth],
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "建立對話失敗");
      }

      const conversationId = data.data.conversationId;

      if (onSearchComplete) {
        onSearchComplete();
      }

      navigate(`/conversations/${conversationId}`);
    } catch (err) {
      console.error("查詢失敗：", err);
      alert("建立對話失敗，請稍後再試");
    } finally {
      setAnimating(false);
    }
  };

  return (
    <div>
      <div className="last-updated-time">最後爬蟲時間：{lastUpdatedTime}</div>

      <div className="search-panel-wrapper">
        <div className={`search-panel-container ${animating ? "fade-out" : ""}`}>
          <div className="search-panel-grid">
            <div className="input-group">
              <Select
                options={industryOptions}
                value={industry}
                onChange={(val) => setindustry([...(val || [])])}
                placeholder="選擇類別"
                isMulti
                isClearable
              />
            </div>

            <div className="input-group">
              <input
                type="text"
                className="search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="請輸入關鍵字"
              />
            </div>

            <div className={`input-group ${limitError ? "input-error" : ""}`}>
              <input
                type="number"
                className="search-input"
                value={limit}
                onChange={(e) => {
                  setLimit(e.target.value);
                  setLimitError(false);
                }}
                onBlur={() => {
                  const numericValue = Number(limit);
                  if (!limit || isNaN(numericValue) || numericValue < 1) {
                    setLimitError(true);
                  } else if (numericValue > 5) {
                    alert("最多只能輸入 10 筆");
                    setLimit("5");
                    setLimitError(false);
                  }
                }}
                placeholder="輸入要的新聞筆數(1~5)"
                min={1}
                max={5}
              />
            </div>

            <div className="input-group">
              <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                <Select
                  options={yearOptions}
                  value={yearOptions.find(opt => opt.value === selectedYear)}
                  onChange={(val) => setSelectedYear(val?.value ?? currentYear)}
                  placeholder="年份"
                />

                <Select
                  options={monthOptions}
                  value={monthOptions.find(opt => opt.value === selectedMonth)}
                  onChange={(val) => setSelectedMonth(val?.value ?? currentMonth)}
                  placeholder="月份"
                />
              </div>
            </div>

            <div></div>

            <div style={{ textAlign: 'right', maxWidth: '240px', width: '100%' }}>
              <button className="search-button" onClick={handleSearch}>
                查詢
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}