/**
 * Chat Page Sidebar - Phase 1
 * Sidebar minimal untuk navigasi dasar pada halaman chat.
 * Di Phase 1 hanya berisi judul dan tombol reset/clear chat.
 */

import React from "react";
import { chatStore } from "../../store/chat_state_store";
import { sessionStore } from "../../store/session_state_store";

export const ChatPageSidebar: React.FC = () => {
  const handleNewChat = (): void => {
    chatStore.clearMessages();
    sessionStore.reset();
  };

  return (
    <div
      style={{
        width: "260px",
        height: "100%",
        backgroundColor: "#1e293b",
        borderRight: "1px solid #334155",
        display: "flex",
        flexDirection: "column",
        padding: "16px",
      }}
    >
      {/* Logo / Judul */}
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            color: "#f1f5f9",
            fontSize: "18px",
            fontWeight: 700,
            margin: 0,
          }}
        >
          🐉 Hydra AI
        </h2>
        <p
          style={{
            color: "#64748b",
            fontSize: "12px",
            margin: "4px 0 0 0",
          }}
        >
          Phase 1 - Chat
        </p>
      </div>

      {/* Tombol Chat Baru */}
      <button
        onClick={handleNewChat}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "8px",
          border: "1px solid #475569",
          backgroundColor: "transparent",
          color: "#e2e8f0",
          fontSize: "13px",
          fontWeight: 500,
          cursor: "pointer",
          textAlign: "left",
          marginBottom: "16px",
        }}
      >
        + Chat Baru
      </button>

      {/* Placeholder untuk history (Phase 2+) */}
      <div
        style={{
          flex: 1,
          color: "#475569",
          fontSize: "12px",
          fontStyle: "italic",
        }}
      >
        Riwayat chat akan muncul di sini (Phase 2)
      </div>

      {/* Status koneksi */}
      <div
        style={{
          padding: "8px 0",
          borderTop: "1px solid #334155",
          color: "#64748b",
          fontSize: "11px",
        }}
      >
        v1.0.0
      </div>
    </div>
  );
};
