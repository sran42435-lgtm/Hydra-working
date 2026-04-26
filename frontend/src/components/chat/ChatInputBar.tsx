/**
 * Chat Input Bar - Phase 1
 * Komponen input pesan dengan tombol kirim.
 * Mendukung pengiriman via tombol Enter (Shift+Enter untuk baris baru).
 */

import React, { useState, useRef, KeyboardEvent } from "react";

export interface ChatInputBarProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSend,
  disabled,
}) => {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = (): void => {
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setMessage("");
    // Fokus kembali ke input setelah kirim
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    // Enter tanpa Shift → kirim
    // Shift+Enter → baris baru (default textarea behavior)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "8px",
        padding: "12px 16px",
        backgroundColor: "#1e293b",
        borderTop: "1px solid #334155",
      }}
    >
      <textarea
        ref={inputRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ketik pesan..."
        disabled={disabled}
        rows={1}
        style={{
          flex: 1,
          resize: "none",
          padding: "10px 14px",
          borderRadius: "12px",
          border: "1px solid #475569",
          backgroundColor: "#0f172a",
          color: "#f1f5f9",
          fontSize: "14px",
          lineHeight: 1.5,
          outline: "none",
          maxHeight: "120px",
          fontFamily: "inherit",
        }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        style={{
          padding: "10px 18px",
          borderRadius: "12px",
          border: "none",
          backgroundColor: disabled || !message.trim() ? "#475569" : "#3b82f6",
          color: "#fff",
          fontWeight: 600,
          fontSize: "14px",
          cursor: disabled || !message.trim() ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Kirim
      </button>
    </div>
  );
};
