import "../styles/PromptHistory.css";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PromptHistoryProps {
  history: Message[];
}

export default function PromptHistory({ history }: PromptHistoryProps) {
  return (
    <div className="prompt-history">
      <h3 className="prompt-history-title">對話紀錄</h3>
      <ul className="chat-history-list">
        {history.map((m, i) => (
          <li key={i} className={`chat-message ${m.role}`}>
            {m.content}
          </li>
        ))}
      </ul>
    </div>
  );
}
