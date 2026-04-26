/**
 * Message Bubble View - Phase 1
 * Menampilkan satu gelembung pesan (user atau assistant).
 */

import React from "react";
import type { Message } from "../../types/chat.types";

export interface MessageBubbleViewProps {
  message: Message;
}

export const MessageBubbleView: React.FC<MessageBubbleViewProps> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "12px",
        padding: "0 16px",
      }}
    >
      <div
        style={{
          maxWidth: "75%",
          padding: "10px 16px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          backgroundColor: isUser ? "#3b82f6" : "#1e293b",
          color: "#f1f5f9",
          fontSize: "14px",
          lineHeight: 1.5,
          wordBreak: "break-word",
          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
        }}
      >
        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{message.content}</p>
        <span
          style={{
            display: "block",
            fontSize: "11px",
            color: isUser ? "#bfdbfe" : "#94a3b8",
            marginTop: "4px",
            textAlign: "right",
          }}
        >
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
};

/** Format timestamp ISO 8601 ke jam:menit lokal */
function formatTime(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
