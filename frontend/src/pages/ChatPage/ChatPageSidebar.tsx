import React from "react";

interface Props {
  onNewChat: () => void;
}

export const ChatPageSidebar: React.FC<Props> = ({ onNewChat }) => {
  return (
    <div style={{
      width: 260,
      height: "100%",
      backgroundColor: "#1e293b",
      borderRight: "1px solid #334155",
      padding: 16,
      display: "flex",
      flexDirection: "column"
    }}>
      <h2 style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700, margin: 0 }}>🐉 Hydra AI</h2>
      <p style={{ color: "#64748b", fontSize: 12, margin: "4px 0 16px 0" }}>Phase 1 - Chat</p>
      <button
        onClick={onNewChat}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid #475569",
          backgroundColor: "transparent",
          color: "#e2e8f0",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          textAlign: "left",
          marginBottom: 16
        }}
      >
        + Chat Baru
      </button>
      <div style={{ flex: 1, color: "#475569", fontSize: 12, fontStyle: "italic" }}>
        Riwayat chat akan muncul di sini (Phase 2)
      </div>
      <div style={{ borderTop: "1px solid #334155", paddingTop: 8, color: "#64748b", fontSize: 11 }}>
        v1.0.0
      </div>
    </div>
  );
};
