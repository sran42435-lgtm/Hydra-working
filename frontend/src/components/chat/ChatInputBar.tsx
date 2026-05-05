import React, { useRef, useState, useEffect, useCallback } from "react";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isComposing, setIsComposing] = useState(false);

  // Auto‑resize the textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, []);

  useEffect(() => {
    autoResize();
  }, [text, autoResize]);

  useEffect(() => {
    autoResize();
  }, [isComposing, autoResize]);

  const handleSend = () => {
    if (!text.trim() || disabled || isLoading) return;
    onSend(text);
    onTextChange("");
    textareaRef.current?.focus();
  };

  const handleStop = () => {
    onStop();
    textareaRef.current?.focus();
  };

  const handleButtonClick = () => {
    if (isLoading) {
      handleStop();
    } else {
      handleSend();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
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
      padding: "0 14px 8px",                   // outer margins
      display: "flex",
      justifyContent: "center",
      backgroundColor: "transparent",
    }}>
      {/* Expandable container */}
      <div style={{
        width: "100%",
        position: "relative",                   // for absolute button
        backgroundColor: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: 30,
        boxShadow: "0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
        border: "1px solid rgba(0,0,0,0.04)",
        padding: "0 18px",                      // left/right internal space
        minHeight: 60,                          // single‑line height
        boxSizing: "border-box",
        transition: "height 0.1s ease",
      }}>
        {/* Textarea that grows */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          rows={1}
          style={{
            width: "100%",
            border: "none",
            backgroundColor: "transparent",
            color: "#1a1a1a",
            fontFamily: "'Outfit', sans-serif",
            fontSize: 16,
            lineHeight: 1.5,
            outline: "none",
            resize: "none",
            padding: "12px 0 52px 0",           // top/bottom spacing – bottom is high enough to clear button
            minHeight: 40,                       // minimum for a single line within the bar
            maxHeight: 200,                      // scroll after this
            overflowY: "auto",
            boxSizing: "border-box",
          }}
        />

        {/* Send / Stop button – absolute at bottom‑right */}
        <button
          onClick={handleButtonClick}
          disabled={!isLoading && isSendDisabled}
          style={{
            position: "absolute",
            right: 10,
            bottom: 12,                          // distance from container bottom (Claude‑like)
            width: 38,                            // 38px circle
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
          }}
        >
          {isLoading ? <StopIcon /> : <SendIcon />}
        </button>
      </div>
    </div>
  );
};

export default ChatInputBar;
