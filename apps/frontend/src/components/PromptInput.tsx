import { useState } from "react";

interface Message {
  role: "user" | "bot";
  content: string;
}

interface PromptInputProps {
  onSubmit: (message: Message) => void;
}

export default function PromptInput({ onSubmit }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    onSubmit({ role: "user", content: trimmed });
    setPrompt("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // 防止換行
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        padding: "0.75rem",
        backgroundColor: "#f8f9fa",
        width: "100%",
      }}
    >
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="輸入 prompt..."
        style={{
          flex: 1,
          padding: "0.5rem 0.75rem",
          borderRadius: "6px",
          border: "1px solid #ccc",
          fontSize: "1rem",
          height: "40px",
          resize: "none",
          boxSizing: "border-box",
        }}
      />
      <button
        onClick={handleSubmit}
        style={{
          padding: "0 1rem",
          borderRadius: "6px",
          border: "1px solid #ccc",
          background: "#223e7b",
          color: "#fff",
          fontSize: "1rem",
          height: "40px",
          cursor: "pointer",
        }}
      >
        送出
      </button>
    </div>
  );
}
