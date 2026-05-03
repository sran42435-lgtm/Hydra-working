import React, { useRef, useState } from "react";

interface ChatPageSidebarProps {
  onNewChat: () => void;
  isMobile: boolean;
  onDragStart?: (clientX: number) => void;
  onDragMove?: (clientX: number) => void;
  onDragEnd?: () => void;
}

export const ChatPageSidebar: React.FC<ChatPageSidebarProps> = ({
  onNewChat,
  isMobile,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  const [history] = useState<string[]>(["Chat tentang AI", "Cara membuat kue", "Resep masakan"]);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef<number>(0);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    setIsDragging(true);
    onDragStart?.(touch.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    onDragMove?.(touch.clientX);
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd?.();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startX.current = e.clientX;
    onDragStart?.(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    onDragMove?.(e.clientX);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd?.();
    }
  };

  return (
    <div
      ref={sidebarRef}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(0,0,0,0.05)",
        position: "relative",
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
      {/* Gagang geser - Hanya muncul di Mobile */}
      {isMobile && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: "6px",
            height: "80px",
            backgroundColor: "rgba(0,0,0,0.1)",
            borderRadius: "4px",
            cursor: "ew-resize",
            touchAction: "none",
          }}
        />
      )}

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 20, fontFamily: "'Sora', sans-serif", fontWeight: 567, color: "#1a1a1a", marginBottom: 8 }}>Hydra AI</h3>
        <p style={{ fontSize: 12, color: "#999" }}>Phase 1</p>
      </div>

      <button
        onClick={onNewChat}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.08)",
          backgroundColor: "rgba(255,255,255,0.8)",
          color: "#1a1a1a",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: 24,
          textAlign: "left",
        }}
      >
        + Chat Baru
      </button>

      <div style={{ flex: 1, overflowY: "auto" }}>
        <p style={{ fontSize: 12, color: "#999", fontWeight: 600, marginBottom: 8 }}>Riwayat (Phase 2)</p>
        {history.map((item, index) => (
          <div
            key={index}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
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
        <p style={{ fontSize: 12, color: "#999" }}>v1.0.0</p>
      </div>
    </div>
  );
};

export default ChatPageSidebar;
