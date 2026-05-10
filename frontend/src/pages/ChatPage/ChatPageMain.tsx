import React, { useState, useEffect, useRef, useCallback } from "react";
import ChatPageSidebar from "./ChatPageSidebar";
import { ChatSessionContainer } from "../../components/chat/ChatSessionContainer";
import { chatStore } from "../../store/chat_state_store";

const HamburgerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="3" y1="6"  x2="21" y2="6" />
    <line x1="3" y1="12" x2="12" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const NewChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="24" height="24">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const MAX_DRAG_RIGHT = 0;
const MAX_DRAG_LEFT = -260;
const CLOSE_THRESHOLD = -100;

export const ChatPageMain: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const rafRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [pressedBtn, setPressedBtn] = useState<string | null>(null);

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
    if (!isDragging) return;
    const diff = currentClientX - dragStartX.current;
    const clamped = Math.min(MAX_DRAG_RIGHT, Math.max(MAX_DRAG_LEFT, diff));
    
    // Gunakan RAF untuk update langsung ke DOM (lebih responsif)
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      setDragOffset(clamped);
    });
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setDragOffset((currentOffset) => {
      if (currentOffset < CLOSE_THRESHOLD) {
        setSidebarOpen(false);
        return 0;
      }
      return 0;
    });
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  const getWrapperStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      height: "100%",
      position: isMobile ? "fixed" : "relative",
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 20,
      willChange: "transform",
      overflow: "hidden",
    };

    if (isMobile) {
      base.width = "100vw";
      // **PENTING: tanpa transisi saat drag**
      if (isDragging) {
        base.transform = `translateX(${dragOffset}px)`;
        base.transition = "none";
      } else {
        base.transition = "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
        base.transform = sidebarOpen ? "translateX(0)" : "translateX(-100%)";
      }
    } else {
      base.width = 260;
      base.transform = "translateX(0)";
      base.transition = "none";
    }

    return base;
  };

  const getPressStyle = (buttonId: string): React.CSSProperties => {
    if (!isMobile) return {};
    return {
      transform: pressedBtn === buttonId ? "scale(0.85)" : "scale(1)",
      transition: "transform 0.1s ease",
    };
  };

  const floatingBtnBase: React.CSSProperties = {
    position: "fixed",
    zIndex: 5,
    background: "#fdf6f0",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(0,0,0,0.04)",
    borderRadius: "50%",
    padding: "8px",
    color: "#1a1a1a",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    userSelect: "none",
    WebkitUserSelect: "none",
    touchAction: "manipulation",
    willChange: "transform",
  };

  return (
    <div style={{ display: "flex", height: "100dvh", width: "100vw", maxWidth: "100%", overflow: "hidden", backgroundColor: "#fafafa", position: "relative" }}>
      
      {isMobile && (
        <button
          onClick={() => {
            const opening = !sidebarOpen;
            setSidebarOpen(opening);
            if (opening) {
              document.dispatchEvent(new CustomEvent("closeActionBoard"));
            }
          }}
          onMouseDown={() => setPressedBtn("hamburger")}
          onMouseUp={() => setPressedBtn(null)}
          onMouseLeave={() => setPressedBtn(null)}
          onTouchStart={() => setPressedBtn("hamburger")}
          onTouchEnd={() => setPressedBtn(null)}
          onTouchCancel={() => setPressedBtn(null)}
          style={{
            ...floatingBtnBase,
            top: 8,
            left: 12,
            ...getPressStyle("hamburger"),
          }}
        >
          <HamburgerIcon />
        </button>
      )}
      
      <button
        onClick={handleNewChat}
        onMouseDown={() => setPressedBtn("newchat")}
        onMouseUp={() => setPressedBtn(null)}
        onMouseLeave={() => setPressedBtn(null)}
        onTouchStart={() => setPressedBtn("newchat")}
        onTouchEnd={() => setPressedBtn(null)}
        onTouchCancel={() => setPressedBtn(null)}
        style={{
          ...floatingBtnBase,
          top: 8,
          right: 12,
          ...getPressStyle("newchat"),
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

      <div style={getWrapperStyle()}>
        <ChatPageSidebar
          onNewChat={handleNewChat}
          isMobile={isMobile}
          dragOffset={dragOffset}
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
