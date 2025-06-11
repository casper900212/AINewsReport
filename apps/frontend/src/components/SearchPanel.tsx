import { useState, useEffect } from "react";
import Select from "react-select";
import { Select as SemiSelect } from "@douyinfe/semi-ui";
import "../styles/SearchPanel.css";
import { useNavigate } from "react-router-dom";
import { useFakeSearchStore } from "../stores/useFakeSearchStore";

export default function SearchPanel() {
  const categoryOptions = [
    { value: "tech", label: "技術" },
    { value: "policy", label: "政策" },
    { value: "news", label: "新聞" },
  ];

  const [category, setCategory] = useState<any[]>([]);
  const [sourceOptions, setSourceOptions] = useState<any[]>([]);
  const [source, setSource] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState<string>("1");

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // 預設選到當前年份和月份
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  const [lastUpdatedTime] = useState("2025-06-02 14:00");

  const navigate = useNavigate();
  const { addRecord } = useFakeSearchStore();

  useEffect(() => {
    const sourceRaw = localStorage.getItem("preferredSources");
    if (sourceRaw) {
      const preferred = JSON.parse(sourceRaw);
      const mapped = preferred.map((val: string) => ({
        value: val,
        label:
          {
            blocktempo: "BlockTempo",
            abmedia: "ABMedia",
            cointelegraph: "Cointelegraph",
          }[val] || val,
      }));
      setSourceOptions(mapped);
      if (mapped.length === 1) setSource([mapped[0]]);
    }
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

  const handleSearch = () => {
    setAnimating(true);

    setTimeout(() => {
      const formattedCategory = category.map((c: any) => c.value);
      const formattedSource = source.map((s: any) => s.value);
      const safeLimit = Math.min(Math.max(Number(limit), 1), 10);

      const payload = {
        keyword: query,
        category: formattedCategory.join(","),
        source: formattedSource.join(", "),
        startDate: startMonth,
        limit: safeLimit,
        conversation: "",
      };

      console.log("模擬查詢送出：", payload);

      const fakeId = `${Math.random().toString(36).substring(2, 10)}`;

      addRecord({
        id: fakeId,
        query: payload.keyword,
        category: payload.category,
        source: payload.source,
        startDate: startMonth,
        keyword: payload.keyword,
        limit: String(safeLimit),
      });

      window.dispatchEvent(new Event("refresh-history"));
      navigate(`/history/${fakeId}`);
    }, 300);
  };

  const [animating, setAnimating] = useState(false);

  return (
    <div>
      {/* 最後爬蟲時間 */}
      <div className="last-updated-time">最後爬蟲時間：{lastUpdatedTime}</div>

      <div className="search-panel-wrapper">
        <div
          className={`search-panel-container ${animating ? "fade-out" : ""}`}
        >
          <div className="search-panel-grid">
            {/* 類別 */}
            <div className="input-group">
              <Select
                options={categoryOptions}
                value={category}
                onChange={(val) => setCategory([...(val || [])])}
                placeholder="選擇類別"
                isMulti
                isClearable
              />
            </div>

            {/* 來源 */}
            <div className="input-group">
              <Select
                options={sourceOptions}
                value={source}
                onChange={(val) => setSource([...(val || [])])}
                placeholder="選擇來源"
                isMulti
                isClearable
              />
            </div>


            {/* 開始月份（年份+月份） */}
            <div className="input-group">
              <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                {/* 年份 */}
                <SemiSelect
                  placeholder="年份"
                  style={{ flex: 1 }}
                  value={selectedYear}
                  onChange={(value) => setSelectedYear(value as number)}
                >
                  {yearOptions.map((option) => (
                    <SemiSelect.Option key={option.value} value={option.value}>
                      {option.label}
                    </SemiSelect.Option>
                  ))}
                </SemiSelect>

                {/* 月份 */}
                <SemiSelect
                  placeholder="月份"
                  style={{ flex: 1 }}
                  value={selectedMonth}
                  onChange={(value) => setSelectedMonth(value as number)}
                >
                  {monthOptions.map((option) => (
                    <SemiSelect.Option key={option.value} value={option.value}>
                      {option.label}
                    </SemiSelect.Option>
                  ))}
                </SemiSelect>
              </div>
            </div>

            {/* 關鍵字 */}
            <div className="input-group">
              <input
                type="text"
                className="search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="請輸入關鍵字"
              />
            </div>

            {/* 筆數 */}
            <div className="input-group">
              <input
                type="number"
                className="search-input"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                onBlur={() => {
                  const numericValue = Number(limit);
                  if (isNaN(numericValue) || numericValue < 1) {
                    setLimit("1");
                  } else if (numericValue > 10) {
                    alert("最多只能輸入 10 筆");
                    setLimit("10");
                  }
                }}
                placeholder="輸入要的新聞筆數"
                min={1}
                max={10}
              />
            </div>

            {/* 查詢按鈕 */}
            <div className="search-button-wrapper">
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
