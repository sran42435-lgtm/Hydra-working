import React, { useState, useRef } from "react";

interface ChatInputBarProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export const ChatInputBar: React.FC<ChatInputBarProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText("");
    inputRef.current?.focus();
  };

  return (
    <div style={{
      padding: "8px 16px 16px",
      display: "flex",
      justifyContent: "center",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 560,
        display: "flex",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderRadius: 30,
        boxShadow: "0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
        border: "1px solid rgba(0,0,0,0.04)",
        padding: "4px",
      }}>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          placeholder="Ketik pesan..."
          disabled={disabled}
          style={{
            flex: 1,
            padding: "10px 44px 10px 18px",
            borderRadius: 26,
            border: "none",
            backgroundColor: "transparent",
            color: "#1a1a1a",
            fontSize: 14,
            outline: "none",
          }}
        />
        <button
          onClick={handleSend}
          disabled={disabled}
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: "none",
            backgroundColor: disabled ? "#ccc" : "#E07B5A",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: disabled ? "not-allowed" : "pointer",
            boxShadow: "0 4px 12px rgba(224,123,90,0.25)",
            flexShrink: 0,
            marginRight: 2,
          }}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
};
