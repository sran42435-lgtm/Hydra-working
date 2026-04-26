/**
 * Chat Page Main - Phase 1
 * Komponen utama halaman chat yang menggabungkan Sidebar dan ChatSessionContainer.
 */

import React from "react";
import { ChatPageSidebar } from "./ChatPageSidebar";
import { ChatSessionContainer } from "../../components/chat/ChatSessionContainer";

export const ChatPageMain: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        backgroundColor: "#0f172a",
      }}
    >
      <ChatPageSidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <ChatSessionContainer />
      </div>
    </div>
  );
};
