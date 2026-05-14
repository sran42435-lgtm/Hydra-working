// src/pages/ChatPage/ChatPageMain.tsx

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

const PanelLeftCloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
    <path d="m16 15-3-3 3-3" />
  </svg>
);

const PanelLeftOpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
    <path d="m14 9 3 3-3 3" />
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

  const [pressedBtn, setPressedBtn] = useState<string | null>(null);
  const prevIsMobileRef = useRef(isMobile);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (prevIsMobileRef.current !== isMobile) {
      setSidebarOpen(!isMobile);
      prevIsMobileRef.current = isMobile;
    }
  }, [isMobile]);

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
    setDragOffset(clamped);
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragOffset((currentOffset) => {
      if (currentOffset < CLOSE_THRESHOLD) {
        setSidebarOpen(false);
        return 0;
      }
      return 0;
    });
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  const getWrapperStyle = (): React.CSSProperties => ({
    height: "100%",
    position: isMobile ? "fixed" : "relative",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 20,
    overflow: "hidden",
    width: isMobile ? "100vw" : 260,
    transition: isDragging
      ? "none"
      : "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
    transform: isMobile
      ? sidebarOpen
        ? isDragging
          ? `translateX(${dragOffset}px)`
          : "translateX(0)"
        : "translateX(-100%)"
      : "translateX(0)",
    opacity: sidebarOpen || isMobile ? 1 : 0,
    pointerEvents: sidebarOpen ? "auto" : "none",
  });

  const getDesktopPanelStyle = (): React.CSSProperties => ({
    width: sidebarOpen ? 260 : 0,
    transition: "width 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
    overflow: "hidden",
    opacity: sidebarOpen ? 1 : 0,
  });

  const sidebarWidth = isMobile ? 0 : (sidebarOpen ? 260 : 0);

  // Style untuk area chat – blur saat panel terbuka di mobile
  const chatAreaStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    position: "relative",
    ...(isMobile && sidebarOpen
      ? {
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          background: "rgba(0,0,0,0.05)",
          transition: "backdrop-filter 0.3s ease, background 0.3s ease",
        }
      : {
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          background: "transparent",
          transition: "backdrop-filter 0.3s ease, background 0.3s ease",
        }),
  };

  // Header style – tetap terlihat dengan latar semi-transparan saat panel terbuka
  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    padding: "0 16px",
    background: isMobile && sidebarOpen
      ? "rgba(253, 246, 240, 0.85)"   // latar krem semi-transparan agar header tetap terlihat
      : "linear-gradient(to bottom, #fdf6f0 0%, #fdf6f0 60%, rgba(253, 246, 240, 0) 100%)",
    backdropFilter: isMobile && sidebarOpen ? "blur(12px)" : "none",
    WebkitBackdropFilter: isMobile && sidebarOpen ? "blur(12px)" : "none",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    maskImage: "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
    WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
    transition: "background 0.3s ease, backdrop-filter 0.3s ease",
  };

  const iconColor = "#1a1a1a";

  const getHeaderBtnStyle = (btnId: string): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "none",
    background: pressedBtn === btnId
      ? "rgba(0,0,0,0.06)"
      : "transparent",
    color: iconColor,
    cursor: "pointer",
    transform: pressedBtn === btnId ? "scale(0.9)" : "scale(1)",
    transition: "transform 0.15s ease, background 0.15s ease, color 0.3s ease",
    boxShadow: "none",
    outline: "none",
    WebkitTapHighlightColor: "transparent",
  });

  return (
    <div style={{ display: "flex", height: "100dvh", width: "100vw", maxWidth: "100%", overflow: "hidden", backgroundColor: "#fafafa", position: "relative" }}>
      
      {isMobile && (
        <div
          onClick={closeSidebar}
          style={{
            position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 10,
            opacity: sidebarOpen ? 1 : 0,
            visibility: sidebarOpen ? "visible" : "hidden",
            transition: "opacity 0.3s ease, visibility 0.3s ease",
            pointerEvents: sidebarOpen ? "auto" : "none",
          }}
        />
      )}

      <div style={isMobile ? getWrapperStyle() : getDesktopPanelStyle()}>
        {isMobile ? (
          <ChatPageSidebar
            onNewChat={handleNewChat}
            isMobile={isMobile}
            dragOffset={dragOffset}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          />
        ) : (
          <div style={{ width: 260, height: "100%" }}>
            <ChatPageSidebar
              onNewChat={handleNewChat}
              isMobile={isMobile}
              dragOffset={0}
            />
          </div>
        )}
      </div>
      
      {/* Area chat – diburamkan saat panel terbuka di mobile */}
      <div style={chatAreaStyle}>
        {/* Header terintegrasi – tetap terlihat dengan latar semi-transparan */}
        <div style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isMobile ? (
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
                style={getHeaderBtnStyle("hamburger")}
              >
                <HamburgerIcon />
              </button>
            ) : (
              <button
                onClick={() => setSidebarOpen(prev => !prev)}
                onMouseDown={() => setPressedBtn("panel")}
                onMouseUp={() => setPressedBtn(null)}
                onMouseLeave={() => setPressedBtn(null)}
                onTouchStart={() => setPressedBtn("panel")}
                onTouchEnd={() => setPressedBtn(null)}
                onTouchCancel={() => setPressedBtn(null)}
                style={getHeaderBtnStyle("panel")}
              >
                {sidebarOpen ? <PanelLeftCloseIcon /> : <PanelLeftOpenIcon />}
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={handleNewChat}
              onMouseDown={() => setPressedBtn("newchat")}
              onMouseUp={() => setPressedBtn(null)}
              onMouseLeave={() => setPressedBtn(null)}
              onTouchStart={() => setPressedBtn("newchat")}
              onTouchEnd={() => setPressedBtn(null)}
              onTouchCancel={() => setPressedBtn(null)}
              style={getHeaderBtnStyle("newchat")}
            >
              <NewChatIcon />
            </button>
          </div>
        </div>
        
        <ChatSessionContainer isDesktop={!isMobile} sidebarWidth={sidebarWidth} />
      </div>
    </div>
  );
};

export default ChatPageMain;
