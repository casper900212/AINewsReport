import { useEffect, useState } from 'react';
import PromptInput from './PromptInput';
import PromptHistory from './PromptHistory';

interface ChatAppProps {
  conversationId: string;
  messages: { role: string; content: string }[];   // 允許任意 role
  onPromptChange?: (prompt: string) => void;
  onReplyChange?: (reply: string) => void;
  setting: () => any;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatApp({
  conversationId,
  messages,
  onPromptChange,
  onReplyChange,
  setting,
}: ChatAppProps) {
  const [conversation, setConversation] = useState<Message[]>([]);

  useEffect(() => {
    if (!messages.length) return;
  
    const clean = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  
    setConversation(clean);
  }, [messages]);
  

  /* 送出 prompt */
  const handleSubmit = async (message: Message) => {
    setConversation((prev) => [...prev, message]);
    onPromptChange?.(message.content);
  
    try {
      const res = await fetch(`http://localhost:3000/api/v1/conversations/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.content }),
      });
  
      if (!res.ok) throw new Error('後端回應失敗');
  
      const data = await res.json();
  
      const reply: Message = {
        role: 'assistant',
        content: data.data.response,
      };
  
      setConversation((prev) => [...prev, reply]);
  
      onReplyChange?.(reply.content);
    } catch (err) {
      console.error('儲存對話失敗：', err);
      const errorReply: Message = {
        role: 'assistant',
        content: '系統錯誤，請稍後再試',
      };
      setConversation((prev) => [...prev, errorReply]);
    }
  };
  
  
  

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <PromptHistory history={conversation} />
      </div>
      <div style={{ borderTop: '1px solid #ddd', padding: '0.5rem 1rem' }}>
        <PromptInput onSubmit={handleSubmit} setIsSec={setting} />
      </div>
    </div>
  );
}
