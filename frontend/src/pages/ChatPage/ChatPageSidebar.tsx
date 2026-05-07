import React, { useRef, useState } from "react";

interface ChatPageSidebarProps {
  onNewChat: () => void;
  isMobile: boolean;
  dragOffset: number;
  onDragStart?: (clientX: number) => void;
  onDragMove?: (clientX: number) => void;
  onDragEnd?: () => void;
}

const NewChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="20" height="20">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

export const ChatPageSidebar: React.FC<ChatPageSidebarProps> = ({
  onNewChat,
  isMobile,
  dragOffset,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  const [history] = useState<string[]>(["Chat tentang AI", "Cara membuat kue", "Resep masakan"]);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef<number>(0);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    startX.current = touch.clientX;
    setIsDragging(true);
    onDragStart?.(touch.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !isDragging) return;
    const touch = e.touches[0];
    onDragMove?.(touch.clientX);
  };

  const handleTouchEnd = () => {
    if (!isMobile || !isDragging) return;
    setIsDragging(false);
    onDragEnd?.();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isMobile) return;
    setIsDragging(true);
    startX.current = e.clientX;
    onDragStart?.(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMobile || !isDragging) return;
    onDragMove?.(e.clientX);
  };

  const handleMouseUp = () => {
    if (!isMobile || !isDragging) return;
    setIsDragging(false);
    onDragEnd?.();
  };

  const extraPadding = isMobile ? Math.max(0, dragOffset) : 0;

  const sidebarFont = "'Nunito', sans-serif";

  return (
    <div
      ref={sidebarRef}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.75)",
        backdropFilter: "blur(150px)",
        WebkitBackdropFilter: "blur(150px)",
        padding: "16px",
        paddingLeft: 16 + extraPadding,
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(0,0,0,0.05)",
        position: "relative",
        boxSizing: "border-box",
        transition: "padding-left 0.15s ease",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Drag handle – mobile only, blue, shifted left */}
      {isMobile && (
        <div
          style={{
            position: "absolute",
            right: 4,
            top: "50%",
            transform: "translateY(-50%)",
            width: "6px",
            height: "80px",
            backgroundColor: "rgba(59, 130, 246, 0.6)",
            borderRadius: "4px",
            cursor: "ew-resize",
            touchAction: "none",
          }}
        />
      )}

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <img
            src="/hydra-icon.png"
            alt="Hydra Logo"
            style={{ width: 28, height: 28, flexShrink: 0 }}
          />
          <h3
            style={{
              fontSize: 20,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 678,
              fontStyle: "italic",
              color: "#1a1a1a",
              margin: 0,
            }}
          >
            Hydra AI
          </h3>
        </div>
        <p style={{ fontSize: 12, color: "#999", fontFamily: sidebarFont }}>Phase 1</p>
      </div>

      <button
        onClick={onNewChat}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "8px 0",
          border: "none",
          backgroundColor: "transparent",
          color: "#E07B5A",
          fontSize: 15,
          fontWeight: 700,
          fontFamily: sidebarFont,
          cursor: "pointer",
          textAlign: "left",
          marginBottom: 16,
        }}
      >
        <NewChatIcon />
        <span>Chat Baru</span>
      </button>

      <div style={{
        width: "100%",
        height: 1,
        backgroundColor: "rgba(0,0,0,0.05)",
        marginBottom: 16,
      }} />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <p style={{ fontSize: 12, color: "#999", fontWeight: 600, fontFamily: sidebarFont, marginBottom: 8 }}>Riwayat (Phase 2)</p>
        {history.map((item, index) => (
          <div
            key={index}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontFamily: sidebarFont,
              color: "#1a1a1a",
              marginBottom: 4,
              backgroundColor: "rgba(0,0,0,0.02)",
            }}
          >
            {item}
          </div>
        ))}
      </div>

      <div style={{ paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
        <p style={{ fontSize: 12, color: "#999", fontFamily: sidebarFont }}>v1.0.0</p>
      </div>
    </div>
  );
};

export default ChatPageSidebar;
