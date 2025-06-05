import { useParams, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import SearchPanel from './SearchPanel';
import PromptInput from './PromptInput';
import PromptHistory from './PromptHistory';
import '../styles/ResultPage.css';

export default function ResultPage() {
  const { historyId } = useParams();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const [showSearchAnim, setShowSearchAnim] = useState(false);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => setShowSearchAnim(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // ✅ 處理送出 prompt：加入歷史 + 顯示當前
  const handlePromptSubmit = (prompt: string) => {
    setPromptHistory((prev) => [...prev, prompt]);
    setCurrentPrompt(prompt);
  };

  const handlePromptSelect = (prompt: string) => {
    setCurrentPrompt(prompt);
  };

  return (
    <div className="result-page-container">
      {/* 🔹查詢欄動畫區 */}
      <div className={`search-header ${showSearchAnim ? 'animate' : ''}`}>
        <SearchPanel />
      </div>

      {/* 🔸主內容分欄：左歷史 + 右畫布 */}
      <div className="result-layout">
        {/* 左欄：歷史 + 輸入 */}
        <div className="left-panel">
          <div className="prompt-history-wrapper">
            <PromptHistory history={promptHistory} onSelect={handlePromptSelect} />
          </div>
          <div className="prompt-input-wrapper">
            <PromptInput onSubmit={handlePromptSubmit} />
          </div>
        </div>

        {/* 右欄：查詢結果 */}
        <div className="right-panel">
          <div className="result-content">
            <h2>{historyId} 的查詢結果</h2>
            <p>關鍵字：{params.get('query')}</p>
            <p>類別：{params.get('category')}</p>
            <p>來源：{params.get('source')}</p>
            <p>日期區間：{params.get('startDate')} ~ {params.get('endDate')}</p>
            <p>筆數：{params.get('limit')}</p>
            <p>目前 Prompt：{currentPrompt}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
