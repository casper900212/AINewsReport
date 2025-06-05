import { useState } from 'react';
import "../styles/PromptHistory.css";


interface PromptHistoryProps {
  history: string[];
  onSelect: (prompt: string) => void;
}

export default function PromptHistory({ history, onSelect }: PromptHistoryProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="prompt-history">
      <h3 className="prompt-history-title">對話紀錄</h3>
      <ul className="prompt-history-list">
        {history.map((prompt, index) => (
          <li
            key={index}
            className={`prompt-history-item ${selected === prompt ? 'active' : ''}`}
            onClick={() => {
              setSelected(prompt);
              onSelect(prompt);
            }}
          >
            {prompt.length > 20 ? prompt.slice(0, 20) + '...' : prompt}
          </li>
        ))}
      </ul>
    </div>
  );
}
