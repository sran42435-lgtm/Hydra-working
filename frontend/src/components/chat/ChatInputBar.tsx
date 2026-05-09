import React, { useRef, useState, useEffect as useLayoutEffect } from "react";

interface ChatInputBarProps {
  text: string;
  onTextChange: (text: string) => void;
  onSend: (message: string) => void;
  onStop: () => void;
  onCancelEdit?: () => void;
  disabled: boolean;
  isLoading: boolean;
  isEditing?: boolean;
}

// Ikon panah atas (send)
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 12 7-7 7 7" />
    <path d="M12 19V5" />
  </svg>
);

// Ikon stop (kotak)
const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="5" y="5" rx="2" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Warna
const ACTIVE_COLOR = "rgb(214, 143, 111)";    // oranye hangat saat ada teks/stop
const INACTIVE_COLOR = "rgb(168, 162, 158)";   // abu-abu hangat saat tidak ada teks

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  text,
  onTextChange,
  onSend,
  onStop,
  onCancelEdit,
  disabled,
  isLoading,
  isEditing = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isComposing, setIsComposing] = useState(false);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [text]);

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

  const chatFont = "'Literata', serif";

  // Warna tombol
  const buttonBg = isLoading
    ? ACTIVE_COLOR
    : isSendDisabled
      ? INACTIVE_COLOR
      : ACTIVE_COLOR;

  return (
    <div style={{
      padding: "0 14px 8px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      backgroundColor: "transparent",
    }}>
      <div style={{
        width: "100%",
        position: "relative",
        backgroundColor: "#fdf6f0",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: 30,
        boxShadow: "0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
        border: isEditing ? "1px solid rgba(224,123,90,0.35)" : "1px solid rgba(0,0,0,0.04)",
        padding: isEditing ? "12px 18px 0 18px" : "0 18px",
        minHeight: 60,
        boxSizing: "border-box",
        transition: "border-color 0.2s ease, padding 0.2s ease",
        display: "flex",
        flexDirection: "column",
      }}>
        {isEditing && (
          <>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: "rgba(224,123,90,0.15)",
                borderRadius: 20,
                padding: "6px 14px",
              }}>
                <span style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "rgba(224,123,90,0.9)",
                  fontFamily: chatFont,
                  textTransform: "lowercase",
                }}>
                  mengedit
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancelEdit?.();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: "none",
                    backgroundColor: "rgba(224,123,90,0.25)",
                    color: "rgba(224,123,90,0.9)",
                    cursor: "pointer",
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            <div style={{
              width: "100%",
              height: 1,
              backgroundColor: "rgba(0,0,0,0.05)",
              marginBottom: 4,
            }} />
          </>
        )}

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
            fontFamily: chatFont,
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1.45,
            letterSpacing: "-0.01em",
            outline: "none",
            resize: "none",
            padding: isEditing ? "8px 0 52px 0" : "12px 0 52px 0",
            minHeight: 40,
            maxHeight: 200,
            overflowY: "auto",
            boxSizing: "border-box",
          }}
        />

        <button
          onClick={handleButtonClick}
          disabled={!isLoading && isSendDisabled}
          style={{
            position: "absolute",
            right: 10,
            bottom: 12,
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: "none",
            backgroundColor: buttonBg,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: isLoading || !isSendDisabled ? "pointer" : "not-allowed",
            boxShadow: isLoading || !isSendDisabled
              ? "0 4px 12px rgba(214, 143, 111, 0.25)"
              : "none",
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
