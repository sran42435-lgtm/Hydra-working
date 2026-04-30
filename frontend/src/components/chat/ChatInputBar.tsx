import React, { useState } from "react";

interface ChatInputBarProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText("");
  };

  return (
    <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid #334155", backgroundColor: "#1e293b" }}>
      <input
        style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #475569", backgroundColor: "#1e293b", color: "#f8fafc" }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        placeholder="Ketik pesan..."
        disabled={disabled}
      />
      <button
        onClick={handleSend}
        disabled={disabled}
        style={{ padding: "10px 16px", borderRadius: 8, border: "none", backgroundColor: disabled ? "#475569" : "#3b82f6", color: "#fff", fontWeight: 600 }}>Kirim</button>
    </div>
  );
};
