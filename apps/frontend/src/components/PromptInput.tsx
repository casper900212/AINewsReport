import { useState } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
}

export default function PromptInput({ onSubmit }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    onSubmit(trimmed); 
    setPrompt(''); 
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="輸入 prompt..."
        style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
      />
      <button
        onClick={handleSubmit}
        style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#223e7b', color: '#fff' }}
      >
        送出
      </button>
    </div>
  );
}
