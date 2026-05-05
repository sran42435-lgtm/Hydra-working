import React, { useRef, useState } from "react";

interface ChatInputBarProps {
  text: string;
  onTextChange: (text: string) => void;
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

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  text,
  onTextChange,
  onSend,
  onStop,
  disabled,
  isLoading,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isComposing, setIsComposing] = useState(false);

  const handleSend = () => {
    if (!text.trim() || disabled || isLoading) return;
    onSend(text);
    onTextChange("");
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
    if (e.key === "Enter" && !isComposing) {
      if (isLoading) {
        handleStop();
      } else {
        handleSend();
      }
    }
  };

  const isSendDisabled = disabled || isLoading || !text.trim();

  const placeholder = (text.length > 0 || isComposing)
    ? ""
    : isLoading
      ? "AI sedang merespons..."
      : "Ketik pesan...";

  return (
    <div style={{
      padding: "0 14px 16px",              // outer side & bottom margin (Claude)
      display: "flex",
      justifyContent: "center",
      backgroundColor: "transparent",
    }}>
      {/* Pill container */}
      <div style={{
        width: "100%",
        height: 60,                          // Claude height
        display: "flex",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: 30,                    // perfect pill
        boxShadow: "0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
        border: "1px solid rgba(0,0,0,0.04)",
        padding: "0 18px",                   // left/right padding (18px Claude spec)
        position: "relative",                // for absolute button positioning
      }}>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          style={{
            flex: 1,
            height: "100%",
            padding: "0 50px 0 0",           // right padding leaves room for the button
            border: "none",
            backgroundColor: "transparent",
            color: "#1a1a1a",
            fontFamily: "'Outfit', sans-serif",
            fontSize: 16,
            outline: "none",
            minWidth: 0,
          }}
        />

        {/* Send / Stop button – absolute right inside the pill */}
        <button
          onClick={handleButtonClick}
          disabled={!isLoading && isSendDisabled}
          style={{
            position: "absolute",
            right: 10,                        // distance from right edge (Claude spec)
            top: "50%",
            transform: "translateY(-50%)",
            width: 38,                        // Claude 38px circle
            height: 38,
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
            boxShadow: isLoading
              ? "0 4px 12px rgba(224,123,90,0.25)"
              : isSendDisabled
                ? "none"
                : "0 4px 12px rgba(224,123,90,0.25)",
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
