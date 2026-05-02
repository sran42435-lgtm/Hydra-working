import React, { useRef, useState, useEffect } from "react";

interface ChatPageSidebarProps {
  onNewChat: () => void;
}

export const ChatPageSidebar: React.FC<ChatPageSidebarProps> = ({ onNewChat }) => {
  const [history, setHistory] = useState<string[]>(["Chat tentang AI", "Cara membuat kue", "Resep masakan"]);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef<number>(0);
  const currentX = useRef<number>(0);
  const [offsetX, setOffsetX] = useState(0);
  const rafId = useRef<number | null>(null);

  const forceReflow = () => {
    if (sidebarRef.current) {
      window.getComputedStyle(sidebarRef.current).transform;
    }
  };

  const resetPosition = () => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      setOffsetX(0);
      forceReflow();
      rafId.current = null;
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    currentX.current = touch.clientX;
    setIsDragging(true);
    setOffsetX(0);
    if (rafId.current) cancelAnimationFrame(rafId.current);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    currentX.current = touch.clientX;
    const diff = currentX.current - startX.current;
    setOffsetX(diff);
    if (diff < -100) {
      const closeEvent = new CustomEvent('closeSidebar');
      document.dispatchEvent(closeEvent);
      setIsDragging(false);
      resetPosition();
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      if (offsetX > -100) {
        resetPosition();
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startX.current = e.clientX;
    currentX.current = e.clientX;
    setOffsetX(0);
    if (rafId.current) cancelAnimationFrame(rafId.current);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;
    setOffsetX(diff);
    if (diff < -100) {
      const closeEvent = new CustomEvent('closeSidebar');
      document.dispatchEvent(closeEvent);
      setIsDragging(false);
      resetPosition();
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      if (offsetX > -100) {
        resetPosition();
      }
    }
  };

  useEffect(() => {
    const handleClose = () => {
      resetPosition();
    };
    document.addEventListener('closeSidebar', handleClose);
    return () => document.removeEventListener('closeSidebar', handleClose);
  }, []);

  useEffect(() => {
    const handleBlur = () => {
      if (isDragging) {
        setIsDragging(false);
        resetPosition();
      }
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [isDragging]);

  return (
    <div
      ref={sidebarRef}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.98)", // Ganti backdrop-filter dengan ini
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        borderRight: "1px solid rgba(0,0,0,0.05)",
        transform: `translateX(${offsetX}px)`,
        willChange: "transform",
        backfaceVisibility: "hidden",
        transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        touchAction: "none",
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
      {/* Gagang geser di tepi kanan */}
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

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a", marginBottom: 8 }}>Hydra AI</h3>
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
