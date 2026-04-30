import React, { useState, useEffect } from "react";
import { ChatPageSidebar } from "./ChatPageSidebar";
import { ChatSessionContainer } from "../../components/chat/ChatSessionContainer";
import { chatStore } from "../../store/chat_state_store";

export const ChatPageMain: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNewChat = () => {
    chatStore.clearMessages();
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div style={{
      display: "flex",
      height: "100dvh",
      width: "100vw",
      maxWidth: "100%",
      overflow: "hidden",
      backgroundColor: "#0f172a",
      position: "relative",
    }}>
      {/* Overlay background – hanya jika mobile & sidebar terbuka */}
      <div
        onClick={() => setSidebarOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
          zIndex: 10,
          opacity: isMobile && sidebarOpen ? 1 : 0,
          visibility: isMobile && sidebarOpen ? "visible" : "hidden",
          transition: "opacity 0.3s ease, visibility 0.3s ease",
        }}
      />

      {/* Sidebar */}
      <div style={{
        width: 260,
        flexShrink: 0,
        height: "100%",
        position: isMobile ? "fixed" : "relative",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 20,
        backgroundColor: "#1e293b",
        transform: isMobile && !sidebarOpen ? "translateX(-100%)" : "translateX(0)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        // Jangan gunakan display: none – biarkan transform yang menangani
      }}>
        <ChatPageSidebar onNewChat={handleNewChat} />
      </div>

      {/* Main chat area */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        {isMobile && (
          <div style={{
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #334155",
          }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: "none",
                border: "none",
                color: "#f1f5f9",
                fontSize: 22,
                cursor: "pointer",
                padding: "4px 8px",
              }}
            >
              ☰
            </button>
            <span style={{ color: "#f1f5f9", marginLeft: 8, fontWeight: 600 }}>🐉 Hydra AI</span>
          </div>
        )}
        <ChatSessionContainer />
      </div>
    </div>
  );
};
