/**
 * Message List View - Phase 1
 * Menampilkan daftar semua pesan dalam percakapan.
 * Menggunakan MessageBubbleView untuk setiap pesan.
 */

import React from "react";
import type { Message } from "../../types/chat.types";
import { MessageBubbleView } from "./MessageBubbleView";
import { TypingStateIndicator } from "./TypingStateIndicator";

export interface MessageListViewProps {
  messages: Message[];
  isTyping: boolean;
}

export const MessageListView: React.FC<MessageListViewProps> = ({
  messages,
  isTyping,
}) => {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px 0",
        backgroundColor: "#0f172a",
      }}
    >
      {messages.length === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "#64748b",
            fontSize: "16px",
            padding: "0 32px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "48px", marginBottom: "12px" }}>🐉</p>
          <p style={{ fontWeight: 600, marginBottom: "4px", color: "#94a3b8" }}>
            Hydra AI
          </p>
          <p style={{ margin: 0 }}>
            Kirim pesan untuk memulai percakapan
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubbleView key={msg.id} message={msg} />
      ))}

      <TypingStateIndicator isTyping={isTyping} />
    </div>
  );
};
