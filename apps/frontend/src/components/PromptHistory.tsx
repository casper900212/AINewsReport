import "../styles/PromptHistory.css";

interface Message {
  role: 'user' | 'bot';
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
        {history.map((msg, index) => (
          <li
            key={index}
            className={`chat-message ${msg.role === 'user' ? 'user' : 'bot'}`}
          >
            {msg.content}
          </li>
        ))}
      </ul>
    </div>
  );
}
