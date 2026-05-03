import React, { useState, useEffect, useRef, useCallback } from "react";
import ChatPageSidebar from "./ChatPageSidebar";
import { ChatSessionContainer } from "../../components/chat/ChatSessionContainer";
import { chatStore } from "../../store/chat_state_store";

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

const MAX_DRAG_RIGHT = 0;    // panel stays at open position, no gap to the left
const MAX_DRAG_LEFT = -260;  // full close distance
const CLOSE_THRESHOLD = -100; // drag beyond this closes the sidebar

export const ChatPageMain: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);

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

  const handleDragStart = useCallback((clientX: number) => {
    dragStartX.current = clientX;
    setIsDragging(true);
    setDragOffset(0);
  }, []);

  const handleDragMove = useCallback((currentClientX: number) => {
    const diff = currentClientX - dragStartX.current;
    // Clamp between max left (closing) and 0 (open) – no rightward movement
    const clamped = Math.min(MAX_DRAG_RIGHT, Math.max(MAX_DRAG_LEFT, diff));
    setDragOffset(clamped);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragOffset((currentOffset) => {
      if (currentOffset < CLOSE_THRESHOLD) {
        setSidebarOpen(false);
        return 0;
      }
      return 0; // snap back to open
    });
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  const getSidebarTransform = (): string => {
    if (isMobile) {
      if (isDragging) {
        return `translateX(${dragOffset}px)`;
      }
      return sidebarOpen ? "translateX(0)" : "translateX(-100%)";
    }
    return "translateX(0)";
  };

  const sidebarTransition = isDragging
    ? "none"
    : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

  return (
    <div style={{ display: "flex", height: "100dvh", width: "100vw", maxWidth: "100%", overflow: "hidden", backgroundColor: "#fafafa", position: "relative" }}>
      
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: "fixed",
            top: 12,
            left: 12,
            zIndex: 5,
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(0,0,0,0.04)",
            borderRadius: "50%",
            padding: "6px",
            color: "#1a1a1a",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <HamburgerIcon />
        </button>
      )}
      
      <button
        onClick={handleNewChat}
        style={{
          position: "fixed",
          top: 12,
          right: 12,
          zIndex: 5,
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(0,0,0,0.04)",
          borderRadius: "50%",
          padding: "6px",
          color: "#1a1a1a",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        <NewChatIcon />
      </button>

      <div
        onClick={closeSidebar}
        style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 10,
          opacity: isMobile && sidebarOpen ? 1 : 0,
          visibility: isMobile && sidebarOpen ? "visible" : "hidden",
          transition: "opacity 0.3s ease, visibility 0.3s ease",
          pointerEvents: isMobile && sidebarOpen ? "auto" : "none",
        }}
      />

      <div
        style={{
          width: 260,
          height: "100%",
          position: isMobile ? "fixed" : "relative",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 20,
          transform: getSidebarTransform(),
          transition: sidebarTransition,
          willChange: "transform",
        }}
      >
        <ChatPageSidebar
          onNewChat={handleNewChat}
          isMobile={isMobile}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />
      </div>
      
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        <ChatSessionContainer isDesktop={!isMobile} />
      </div>
    </div>
  );
};

export default ChatPageMain;
