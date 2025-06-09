import { useState, useEffect } from 'react';
import '../styles/SubscriptionPage.css';

const sources = [
  { value: 'blocktempo', label: 'BlockTempo' },
  { value: 'abmedia', label: 'abmedia' },
  { value: 'cointelegraph', label: 'Cointelegraph' },
];

export default function SubscriptionPage() {
  const [selected, setSelected] = useState<string[]>(() => {
    const stored = localStorage.getItem('preferredSources');
    return stored ? JSON.parse(stored) : [];
  });

  const toggleSelection = (value: string) => {
    const updated = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];

    setSelected(updated);
    localStorage.setItem('preferredSources', JSON.stringify(updated));
  };

  const [startDate, setStartDate] = useState('');
  const [frequency, setFrequency] = useState('');
  const [startTime, setStartTime] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('crawlerScheduleV2');
    if (stored) {
      const parsed = JSON.parse(stored);
      setStartDate(parsed.startDate || '');
      setFrequency(parsed.frequency || '');
      setStartTime(parsed.startTime || '');
    }
  }, []);

  const handleSave = () => {
    if (!startDate || !frequency || !startTime) {
      alert('請完整填寫所有排程欄位');
      return;
    }

    const config = { startDate, frequency, startTime };
    localStorage.setItem('crawlerScheduleV2', JSON.stringify(config));
    alert('排程已儲存');
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
        {sources.map((src) => (
          <label key={src.value} className="source-option">
            <input
              type="checkbox"
              checked={selected.includes(src.value)}
              onChange={() => toggleSelection(src.value)}
            />
            {src.label}
          </label>
        ))}
      </section>

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
