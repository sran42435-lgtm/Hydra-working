import React from "react";
import { HydraIcon } from "../../components/ui/HydraIcon";

interface Props { onNewChat: () => void; }

export const ChatPageSidebar: React.FC<Props> = ({ onNewChat }) => (
  <div style={{
    width: 260,
    height: "100%",
    backgroundColor: "#fff",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #e5e5e5"
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <HydraIcon size={24} />
      <h2 style={{ color: "#1a1a1a", fontSize: 18, fontWeight: 700, margin: 0 }}>
        Hydra AI
      </h2>
    </div>
    <p style={{ color: "#888", fontSize: 12, margin: "4px 0 16px 0" }}>Phase 1</p>
    <button
      onClick={onNewChat}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #e5e5e5",
        backgroundColor: "#fff",
        color: "#1a1a1a",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        textAlign: "left",
        marginBottom: 16
      }}
    >
      + Chat Baru
    </button>
    <div style={{ flex: 1, color: "#aaa", fontSize: 12, fontStyle: "italic" }}>
      Riwayat (Phase 2)
    </div>
    <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: 8, color: "#aaa", fontSize: 11 }}>
      v1.0.0
    </div>
  </div>
);
