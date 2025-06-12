import { useState, useEffect } from 'react';
import '../styles/SubscriptionPage.css';

type Source = {
  id: number; // ✅ 統一為 number
  value: string;
  label: string;
  enabled: boolean;
};

export default function SubscriptionPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [frequency, setFrequency] = useState('');
  const [startTime, setStartTime] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/api/v1/crawler', {
      headers: {
        Accept: 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        const mapped: Source[] = data.data.map((c: any): Source => ({
          id: c.id,
          value: c.scriptFilename.replace('.py', ''),
          label: c.name,
          enabled: c.enabled,
        }));
        setSources(mapped);
        setSelected(mapped.filter(c => c.enabled).map(c => c.value));
      })
      .catch(err => {
        console.error('無法載入來源清單：', err);
      });
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('crawlerScheduleV2');
    if (stored) {
      const parsed = JSON.parse(stored);
      setStartDate(parsed.startDate || '');
      setFrequency(parsed.frequency || '');
      setStartTime(parsed.startTime || '');
    }
  }, []);

  const toggleSelection = async (value: string) => {
    const isSelected = selected.includes(value);
    const updated = isSelected
      ? selected.filter((v) => v !== value)
      : [...selected, value];

    setSelected(updated);
    localStorage.setItem('preferredSources', JSON.stringify(updated));

    const source = sources.find((s) => s.value === value);
    if (!source) return;

    try {
      const res = await fetch(`http://localhost:3000/api/v1/crawler/${source.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ enabled: !isSelected }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      setSources((prev) =>
        prev.map((s) =>
          s.id === source.id ? { ...s, enabled: !isSelected } : s
        )
      );
    } catch (err) {
      alert(`更新啟用狀態失敗：${(err as Error).message}`);
    }
  };

  const handleSave = () => {
    if (!startDate || !frequency || !startTime) {
      alert('請完整填寫所有排程欄位');
      return;
    }
    const config = { startDate, frequency, startTime };
    localStorage.setItem('crawlerScheduleV2', JSON.stringify(config));
    alert('排程已儲存');
  };

  const handleTriggerCrawlers = async () => {
    const selectedSourceIds = sources
      .filter((s) => s.enabled)
      .map((s) => s.id);

    const results: {
      id: number;
      label: string;
      success: boolean;
      count?: number;
      error?: string;
    }[] = [];

    try {
      for (const id of selectedSourceIds) {
        const label = sources.find((s) => s.id === id)?.label || `ID ${id}`;
        try {
          const res = await fetch(`http://localhost:3000/api/v1/crawler/${id}/run`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
            },
          });

          if (!res.ok) {
            const errorText = await res.text();
            results.push({ id, label, success: false, error: errorText });
            continue;
          }

          const data = await res.json();
          results.push({ id, label, success: true, count: data.count });
        } catch (err: any) {
          results.push({ id, label, success: false, error: err.message });
        }
      }

      const successList = results.filter((r) => r.success);
      const failList = results
        .filter((r) => !r.success)
        .map((r) => `${r.label}${r.error ? `：${r.error}` : ''}`)
        .join('\n');

      let message = '';
      if (successList.length) message += `執行成功`;
      if (failList) message += `\n執行失敗：\n${failList}`;
      if (!message) message = '沒有任何執行結果';
      alert(message.trim());
    } catch (err) {
      console.error(err);
      alert('執行過程中發生例外錯誤');
    }
  };

  const getFrequencyLabel = (value: string) => {
    switch (value) {
      case 'daily': return '每天';
      case 'weekly': return '每週';
      case 'monthly': return '每月';
      default: return '';
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
                onChange={() => toggleSelection(src.value)}
              />
              {src.label}
            </label>
          ))
        )}
      </section>

      <div style={{ marginTop: '1.5rem' }}>
        <button onClick={handleTriggerCrawlers}>手動觸發所有爬蟲</button>
      </div>

      <section className="schedule-section">
        <h2>設定爬蟲排程</h2>
        <div className="form-group">
          <label>
            開始日期：
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>

          <label>
            重複頻率：
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              <option value="" disabled>選擇頻率</option>
              <option value="daily">每天</option>
              <option value="weekly">每週</option>
              <option value="monthly">每月</option>
            </select>
          </label>

          <label>
            開始時間：
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </label>

          <button onClick={handleSave}>儲存排程</button>
        </div>

        {startDate && frequency && startTime && (
          <div className="current-schedule">
            當前排程：從 {startDate} 起，{getFrequencyLabel(frequency)}，{startTime} 開始
          </div>
        )}
      </section>
    </div>
  );
}
