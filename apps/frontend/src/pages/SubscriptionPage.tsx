import { useEffect, useState } from "react";
import Select from "react-select";
import "../styles/SubscriptionPage.css";

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const yearOptions = Array.from({ length: 11 }, (_, i) => {
  const year = currentYear - 10 + i;
  return { label: year.toString(), value: year };
});

const getMonthOptions = (year: number | null) => {
  const maxMonth = year === currentYear ? currentMonth : 12;
  return Array.from({ length: maxMonth }, (_, i) => i + 1);
};

const cronOptions = [
  { value: "", label: "未設定" },
  { value: "0 0 1 * *", label: "每月一次" },
];

type Source = {
  id: number;
  value: string;
  label: string;
  enabled: boolean;
};

export default function SubscriptionPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [, setSelected] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<string>("");

  const [manualStartYear, setManualStartYear] = useState<number | null>(null);
  const [manualStartMonth, setManualStartMonth] = useState<number | null>(null);
  const [manualEndYear, setManualEndYear] = useState<number | null>(null);
  const [manualEndMonth, setManualEndMonth] = useState<number | null>(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/v1/crawler")
      .then((res) => res.json())
      .then((data) => {
        const mapped: Source[] = data.data.map(
          (c: {
            id: number;
            scriptFilename: string;
            name: string;
            enabled: boolean;
          }) => ({
            id: c.id,
            value: c.scriptFilename.replace(".py", ""),
            label: c.name,
            enabled: c.enabled,
          })
        );
        setSources(mapped);
        setSelected(mapped.filter((c) => c.enabled).map((c) => c.value));
      })
      .catch((err) => console.error("無法載入來源清單：", err));

    fetch("http://localhost:3000/api/v1/schedule")
      .then((res) => res.json())
      .then((data) => {
        setFrequency(data?.data?.cron?.trim?.() || "");
      })
      .catch((err) => {
        console.error("無法取得排程設定：", err);
        setFrequency("");
      });

    setManualStartYear(currentYear);
    setManualStartMonth(currentMonth);
    setManualEndYear(currentYear);
    setManualEndMonth(currentMonth);
  }, []);

  const toggleSource = (src: Source) => {
    const updated = !src.enabled;
    fetch(`http://localhost:3000/api/v1/crawler/${src.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: src.label,
        enabled: updated,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        setSources((prev) =>
          prev.map((s) => (s.id === src.id ? { ...s, enabled: updated } : s))
        );
      })
      .catch((err) => {
        console.error("更新來源狀態失敗：", err);
        alert("更新來源狀態失敗");
      });
  };

  const handleSave = async () => {
    if (!frequency) {
      alert("請選擇排程頻率");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/v1/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ cron: frequency }),
      });
      const result = await response.json();
      if (response.ok && result.status === "Success") {
        alert("排程已儲存並成功送出 API");
      } else {
        alert("API 回傳錯誤");
      }
    } catch (error) {
      alert("無法連接 API");
    }
  };

  const handleManualTrigger = async () => {
    if (
      !manualStartYear ||
      !manualStartMonth ||
      !manualEndYear ||
      !manualEndMonth
    ) {
      alert("請選擇完整的起迄區間");
      return;
    }

    const start = `${manualStartYear}-${String(manualStartMonth).padStart(2, "0")}`;
    const end = `${manualEndYear}-${String(manualEndMonth).padStart(2, "0")}`;
    const enabledSources = sources.filter((s) => s.enabled);

    if (enabledSources.length === 0) {
      alert("請至少啟用一個爬蟲來源");
      return;
    }

    try {
      const results = await Promise.all(
        enabledSources.map((src) =>
          fetch(`http://localhost:3000/api/v1/crawler/${src.id}/run`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ start, end }),
          })
            .then((res) => res.json())
            .then((data) => ({
              source: src.label,
              count: data?.data?.count ?? 0,
              status: data?.data?.status ?? "unknown",
            }))
        )
      );

      const summary = results
        .map((r) => `${r.source}: ${r.count} 筆 (${r.status})`)
        .join("\n");
      alert(`手動觸發完成：\n${summary}`);
    } catch (err) {
      alert("手動觸發失敗，請稍後再試");
    }
  };

  return (
    <div className="subscription-page">
      <h1>訂閱管理</h1>

      <section className="source-section">
        <h2>選擇來源</h2>
        {sources.length === 0 ? (
          <p>目前尚無可用的爬蟲來源</p>
        ) : (
          sources.map((src) => (
            <label key={src.value} className="source-option">
              <input
                type="checkbox"
                checked={src.enabled}
                onChange={() => toggleSource(src)}
              />
              {src.label}
            </label>
          ))
        )}
      </section>

      <section className="schedule-section">
        <h2>設定爬蟲排程</h2>
        <div className="form-group">
          <label>
            重複頻率：
            <Select
              options={cronOptions}
              value={cronOptions.find((opt) => opt.value === frequency) || null}
              onChange={(opt) => setFrequency(opt?.value || "")}
            />
          </label>
        </div>
        <div style={{ textAlign: "right" }}>
          <button className="search-button" onClick={handleSave}>
            儲存排程
          </button>
        </div>
      </section>

      <section className="source-section">
        <h5>手動觸發爬蟲</h5>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '210px',fontSize: "16px" }}>
          <div>開始時間</div>
          <div>結束時間</div>
          </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, auto)",
            gap: "16px",
            marginBottom: "1rem",
          }}
        >
          {[
            {
              value: manualStartYear,
              setValue: setManualStartYear,
              placeholder: "起始年份",
              options: yearOptions,
            },
            {
              value: manualStartMonth,
              setValue: setManualStartMonth,
              placeholder: "起始月份",
              options: getMonthOptions(manualStartYear).map((m) => ({
                value: m,
                label: String(m).padStart(2, "0"),
              })),
            },
            {
              value: manualEndYear,
              setValue: setManualEndYear,
              placeholder: "結束年份",
              options: yearOptions,
            },
            {
              value: manualEndMonth,
              setValue: setManualEndMonth,
              placeholder: "結束月份",
              options: getMonthOptions(manualEndYear).map((m) => ({
                value: m,
                label: String(m).padStart(2, "0"),
              })),
            },
          ].map((item, idx) => (
            <Select
              key={idx}
              options={item.options}
              value={
                item.options.find((opt) => opt.value === item.value) || null
              }
              isSearchable
              placeholder={item.placeholder}
            />
          ))}
        </div>
        <div style={{ textAlign: "right" }}>
          <button className="search-button" onClick={handleManualTrigger}>
            開始
          </button>
        </div>
      </section>
    </div>
  );
}
