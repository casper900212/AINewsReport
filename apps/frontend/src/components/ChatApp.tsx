import { useEffect, useState } from 'react';
import PromptInput from './PromptInput';
import PromptHistory from './PromptHistory';

interface ChatAppProps {
  historyId: string;
  onPromptChange?: (prompt: string) => void;
  onReplyChange?: (reply: string) => void;
}

interface Message {
  role: 'user' | 'bot';
  content: string;
}

export default function ChatApp({ historyId, onPromptChange, onReplyChange }: ChatAppProps) {
  const [conversation, setConversation] = useState<Message[]>([]);

  // ✅ 載入歷史對話資料
  useEffect(() => {
    if (!historyId) return;
    fetch(`${import.meta.env.VITE_API_BASE}/history/${historyId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.conversation)) {
          setConversation(data.conversation);
        }
      })
      .catch((err) => {
        console.error('載入對話紀錄失敗：', err);
      });
  }, [historyId]);

  // ✅ 處理使用者輸入
  const handleSubmit = async (message: Message) => {
    setConversation((prev) => [...prev, message]);

    if (message.role === 'user') {
      const reply: Message = {
        role: 'bot',
        content: `回覆：「${message.content}」`,
      };

      setTimeout(() => {
        setConversation((prev) => [...prev, reply]);

        onPromptChange?.(message.content);
        onReplyChange?.(reply.content);
      }, 500);

      try {
        await fetch(`${import.meta.env.VITE_API_BASE}/history/${historyId}/conversation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation: [message, reply],
          }),
        });
      } catch (err) {
        console.error('儲存對話失敗：', err);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <PromptHistory history={conversation} />
      </div>
      <div style={{ borderTop: '1px solid #ddd', padding: '0.5rem 1rem' }}>
        <PromptInput onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
