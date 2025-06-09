import { useState, useEffect } from "react";
import Select from "react-select";
import { DateRangePicker } from "rsuite";
import { subDays, startOfDay, startOfMonth } from "date-fns";
import { zhTW } from "date-fns/locale";
import "../styles/SearchPanel.css";
import { useNavigate } from "react-router-dom";
import { useFakeSearchStore } from '../stores/useFakeSearchStore';

export default function SearchPanel() {
  console.log("SearchPanel 已掛載");

  const categoryOptions = [
    { value: "tech", label: "技術" },
    { value: "policy", label: "政策" },
    { value: "news", label: "新聞" },
  ];

  const [category, setCategory] = useState<any[]>([]);
  const [sourceOptions, setSourceOptions] = useState<any[]>([]);
  const [source, setSource] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState("");
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    startOfDay(new Date()),
    new Date(),
  ]);

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

  const handleSearch = async () => {

    const formattedCategory = category.map((c: any) => c.value);
    const formattedSource = source.map((s: any) => s.value);
    const [startDate, endDate] = dateRange;

    const payload = {
      keyword: query,
      category: formattedCategory.join(","),
      source: formattedSource[0] || "",
      dateRange: `${startDate.toISOString().split("T")[0]} ~ ${endDate.toISOString().split("T")[0]}`,
      limit: Number(limit),
      conversation: "",
    };

    console.log("✅ 查詢送出：", payload);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`後端錯誤：${response.status}`);
      const res = await response.json();
      console.log("📦 後端回傳：", res);

      const data = res?.data;
      const id = data?.id;
      if (!id) {
        console.error("❌ 缺少 id：", res);
        alert("查詢成功，但未回傳查詢 ID");
        return;
      }

      addRecord({
        id,
        query: data.keyword,
        category: data.category,
        source: data.source,
        startDate: data.dateRange.split(' ~ ')[0],
        endDate: data.dateRange.split(' ~ ')[1],
        limit: String(data.limit),
      });

      window.dispatchEvent(new Event("refresh-history"));

      console.log("✅ 查詢成功，跳轉至：", `/history/${id}`);
      navigate(`/history/${id}`);
    } catch (err) {
      console.error("查詢失敗：", err);
      alert("新增查詢紀錄失敗，請稍後再試");
    }
  };

  const today = new Date();
  const quickRanges = [
    { label: "今天", value: [startOfDay(today), today], closeOverlay: true },
    {
      label: "最近 7 天",
      value: [subDays(today, 6), today],
      closeOverlay: true,
    },
    {
      label: "最近 30 天",
      value: [subDays(today, 29), today],
      closeOverlay: true,
    },
    { label: "本月", value: [startOfMonth(today), today], closeOverlay: true },
  ];

  return (
    <div className="search-panel-wrapper">
      <div className="search-panel-container">
        <div className="search-panel-grid">
          {/* 類別 */}
          <div className="input-group">
            <Select
              options={categoryOptions}
              value={category}
              onChange={(val) => setCategory(val || [])}
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
              onChange={(val) => setSource(val || [])}
              placeholder="選擇來源"
              isMulti
              isClearable
            />
          </div>

          {/* 日期 */}
          <div className="input-group">
            <DateRangePicker
              value={dateRange}
              onChange={(range) => range && setDateRange(range)}
              format="yyyy/MM/dd"
              placeholder="選擇日期區間"
              oneTap={false}
              style={{ width: "100%" }}
              locale={zhTW}
              ranges={quickRanges}
            />
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
              placeholder="輸入要顯示的筆數"
              min={1}
            />
          </div>

          {/* 查詢按鈕 */}
          <div
            className="input-group"
            style={{ display: "flex", justifyContent: "center" }}
          >
            <button
              className="search-button"
              onClick={() => {
                console.log("🖱 按下查詢按鈕");
                handleSearch();
              }}
            >
              查詢
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}