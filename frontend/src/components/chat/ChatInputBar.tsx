import React, { useState, useRef } from "react";

interface ChatInputBarProps {
  onSend: (message: string) => void;
  onStop: () => void;
  disabled: boolean;
  isLoading: boolean;
}

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const StopIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);

export const ChatInputBar: React.FC<ChatInputBarProps> = ({ onSend, onStop, disabled, isLoading }) => {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!text.trim() || disabled || isLoading) return;
    onSend(text);
    setText("");
    inputRef.current?.focus();
  };

  const handleStop = () => {
    onStop();
    inputRef.current?.focus();
  };

  const handleButtonClick = () => {
    if (isLoading) {
      handleStop();
    } else {
      handleSend();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (isLoading) {
        handleStop();
      } else {
        handleSend();
      }
    }
  };

  const isSendDisabled = disabled || isLoading || !text.trim();

  return (
    <div style={{
      padding: "0 16px 16px",
      display: "flex",
      justifyContent: "center",
      backgroundColor: "transparent",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 560,
        display: "flex",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: 30,
        boxShadow: "0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
        border: "1px solid rgba(0,0,0,0.04)",
        padding: "4px 4px 4px 16px",
        gap: 4,
      }}>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? "AI sedang merespons..." : "Ketik pesan..."}
          disabled={disabled || isLoading}
          style={{
            flex: 1,
            padding: "8px 4px 8px 0",
            borderRadius: 26,
            border: "none",
            backgroundColor: "transparent",
            color: "#1a1a1a",
            fontFamily: "'Outfit', sans-serif",
            fontSize: 16,
            outline: "none",
            minWidth: 0,
          }}
        />

        {/* Single button that toggles between Send and Stop */}
        <button
          onClick={handleButtonClick}
          disabled={!isLoading && isSendDisabled}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "none",
            backgroundColor: isLoading
              ? "#E07B5A"
              : isSendDisabled
                ? "#ccc"
                : "#E07B5A",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: isLoading
              ? "pointer"
              : isSendDisabled
                ? "not-allowed"
                : "pointer",
            boxShadow: "0 4px 12px rgba(224,123,90,0.25)",
            flexShrink: 0,
          }}
        >
          {isLoading ? <StopIcon /> : <SendIcon />}
        </button>
      </div>
    </div>
  );
};

export default ChatInputBar;
