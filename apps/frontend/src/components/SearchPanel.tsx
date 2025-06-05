import { useState } from "react";
import Select from "react-select";
import { DateRangePicker } from "rsuite";
import {
  subDays,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { zhTW } from "date-fns/locale";
import '../styles/SearchPanel.css';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';


const categoryOptions = [
  { value: "tech", label: "技術" },
  { value: "policy", label: "政策" },
  { value: "news", label: "新聞" },
];

const sourceOptions = [
  { value: "blocktempo", label: "BlockTempo" },
  { value: "abmedia", label: "動區" },
  { value: "cointelegraph", label: "Cointelegraph" },
];

export default function SearchPanel() {
  const [category, setCategory] = useState(null);
  const [source, setSource] = useState(null);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState("");

  const [dateRange, setDateRange] = useState<[Date, Date]>([
    startOfDay(new Date()),
    new Date(),
  ]);

  const today = new Date();

  const quickRanges = [
    {
      label: "今天",
      value: [startOfDay(today), today],
      closeOverlay: true,
    },
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
    {
      label: "本月",
      value: [startOfMonth(today), today],
      closeOverlay: true,
    },
  ];


  const historyCountRef = useRef(1); // 初始為 history1
  const navigate = useNavigate();
  const handleSearch = () => {
    const id = `history${historyCountRef.current}`;
    historyCountRef.current += 1; // 下一次遞增
  
    // 保存查詢參數（query string）
    const params = new URLSearchParams({
      query,
      category: category?.value || '',
      source: source?.value || '',
      startDate: dateRange[0].toISOString(),
      endDate: dateRange[1].toISOString(),
      limit,
    });
  
    navigate(`/${id}?${params.toString()}`);
  };
  


  return (
    <div className="search-panel-wrapper">
      <div className="search-panel-container">
        <div className="search-panel-grid">
          {/* 第一列：類別、來源、日期 */}
          <div className="input-group">
            <Select
              options={categoryOptions}
              value={category}
              onChange={setCategory}
              placeholder="選擇類別"
              isClearable
            />
          </div>
          <div className="input-group">
            <Select
              options={sourceOptions}
              value={source}
              onChange={setSource}
              placeholder="選擇來源"
              isClearable
            />
          </div>
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

          {/* 第二列：關鍵字、筆數、查詢 */}
          <div className="input-group">
            <input
              type="text"
              className="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="請輸入關鍵字"
            />
          </div>

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

          <div className="input-group" style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="search-button" onClick={handleSearch}>
              查詢
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
