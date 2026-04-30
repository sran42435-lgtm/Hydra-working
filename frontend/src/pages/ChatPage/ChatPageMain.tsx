import React, { useState, useEffect } from "react";
import { ChatPageSidebar } from "./ChatPageSidebar";
import { ChatSessionContainer } from "../../components/chat/ChatSessionContainer";
import { chatStore } from "../../store/chat_state_store";
import { HydraIcon } from "../../components/ui/HydraIcon";

const HamburgerIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const NewChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="20" height="20">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

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
    <div style={{ display: "flex", height: "100dvh", width: "100vw", maxWidth: "100%", overflow: "hidden", backgroundColor: "#fafafa", position: "relative" }}>
      {/* Overlay */}
      <div
        onClick={() => setSidebarOpen(false)}
        style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 10,
          opacity: isMobile && sidebarOpen ? 1 : 0,
          visibility: isMobile && sidebarOpen ? "visible" : "hidden",
          transition: "opacity 0.3s ease, visibility 0.3s ease",
        }}
      />
      {/* Sidebar */}
      <div style={{
        width: 260, flexShrink: 0, height: "100%",
        position: isMobile ? "fixed" : "relative", left: 0, top: 0, bottom: 0, zIndex: 20,
        backgroundColor: "#fff", borderRight: "1px solid #e5e5e5",
        transform: isMobile && !sidebarOpen ? "translateX(-100%)" : "translateX(0)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        <ChatPageSidebar onNewChat={handleNewChat} />
      </div>
      {/* Main chat area */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {isMobile && (
          <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", borderBottom: "1px solid #e5e5e5", backgroundColor: "#fff" }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: "none", border: "none", color: "#1a1a1a", cursor: "pointer", padding: "4px 8px", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <HamburgerIcon />
            </button>
            <HydraIcon size={20} />
            <span style={{ color: "#1a1a1a", marginLeft: 6, fontWeight: 600, flex: 1 }}>Hydra AI</span>
            {/* Tombol New Chat di kanan atas (mobile) */}
            <button
              onClick={handleNewChat}
              style={{
                background: "none",
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                padding: "4px 8px",
                cursor: "pointer",
                color: "#1a1a1a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <NewChatIcon />
            </button>
          </div>
        )}
        {!isMobile && (
          <div style={{ padding: "8px 16px", display: "flex", alignItems: "center", borderBottom: "1px solid #e5e5e5", backgroundColor: "#fff" }}>
            <span style={{ color: "#1a1a1a", fontWeight: 600, flex: 1 }}>Hydra AI</span>
            {/* Tombol New Chat di kanan atas (desktop) */}
            <button
              onClick={handleNewChat}
              style={{
                background: "none",
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                padding: "4px 8px",
                cursor: "pointer",
                color: "#1a1a1a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <NewChatIcon />
            </button>
          </div>
        )}
        <ChatSessionContainer />
      </div>
    </div>
  );
};
