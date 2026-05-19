// frontend/src/components/chat/AIMessageSheet.tsx

import React, { useEffect, useRef, useCallback, useState } from "react";

interface AIMessageSheetProps {
  content: string;
  onClose: () => void;
  isDesktop?: boolean;
  sidebarWidth?: number;
}

const CLOSE_THRESHOLD = 150;
const VELOCITY_THRESHOLD = 0.5;
const EXPAND_VELOCITY_THRESHOLD = -0.4;   // kecepatan ke atas untuk memicu expand
const EXPAND_OFFSET_THRESHOLD = -80;      // offset negatif (tarikan ke atas) minimal

export const AIMessageSheet: React.FC<AIMessageSheetProps> = ({
  content,
  onClose,
  isDesktop = false,
  sidebarWidth = 0,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const offsetRef = useRef(0);

  const [expanded, setExpanded] = useState(false);
  const [backPressed, setBackPressed] = useState(false);

  // Reset expanded saat konten berubah
  useEffect(() => {
    setExpanded(false);
  }, [content]);

  // Animasi penutupan
  const animateClose = useCallback(() => {
    const sheet = sheetRef.current;
    if (!sheet) {
      onClose();
      return;
    }
    sheet.style.transition = "transform 0.3s ease-in";
    sheet.style.transform = "translateY(100%)";
    const handler = () => {
      sheet.removeEventListener("transitionend", handler);
      onClose();
    };
    sheet.addEventListener("transitionend", handler);
  }, [onClose]);

  // Kembali dari fullscreen
  const collapseFromFullscreen = useCallback(() => {
    setExpanded(false);
    const sheet = sheetRef.current;
    if (!sheet) return;
    sheet.style.transition = "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)";
    sheet.style.transform = "translateY(0px)";
    offsetRef.current = 0;
  }, []);

  // --- Drag handler (hanya mengubah translateY via ref, tanpa state) ---
  const handlePointerDown = useCallback((clientY: number) => {
    if (!sheetRef.current || expanded) return;
    draggingRef.current = true;
    startYRef.current = clientY;
    lastYRef.current = clientY;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
    offsetRef.current = 0;

    sheetRef.current.style.transition = "none";
    sheetRef.current.style.transform = "translateY(0px)";
  }, [expanded]);

  const handlePointerMove = useCallback((clientY: number) => {
    if (!draggingRef.current || !sheetRef.current || expanded) return;
    const now = Date.now();
    const dt = now - lastTimeRef.current;
    lastTimeRef.current = now;
    const rawDiff = clientY - startYRef.current;

    if (dt > 0) velocityRef.current = (clientY - lastYRef.current) / dt;
    lastYRef.current = clientY;

    // Hanya izinkan offset positif (tarik ke bawah) atau sedikit negatif (tarik ke atas)
    // untuk memberi isyarat visual, tapi tetap menempel di bawah.
    const clampedDiff = Math.min(rawDiff, 50); // batasi tarikan ke atas agar tidak terlalu jauh
    offsetRef.current = Math.max(0, clampedDiff); // visual hanya di >= 0

    sheetRef.current.style.transform = `translateY(${offsetRef.current}px)`;
  }, [expanded]);

  const handlePointerUp = useCallback(() => {
    if (!draggingRef.current || !sheetRef.current) return;
    draggingRef.current = false;
    const finalOffset = offsetRef.current;
    const finalVelocity = velocityRef.current;

    if (!expanded) {
      // Cek apakah ditarik ke atas dengan kecepatan/offset yang cukup
      const rawDiff = lastYRef.current - startYRef.current;
      if ((rawDiff < EXPAND_OFFSET_THRESHOLD && finalVelocity < 0) || finalVelocity < EXPAND_VELOCITY_THRESHOLD) {
        // Expand ke fullscreen
        setExpanded(true);
        sheetRef.current.style.transition = "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)";
        sheetRef.current.style.transform = "translateY(0px)";
        offsetRef.current = 0;
      } else if (finalOffset > CLOSE_THRESHOLD || finalVelocity > VELOCITY_THRESHOLD) {
        animateClose();
      } else {
        // Kembali ke posisi awal
        sheetRef.current.style.transition = "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)";
        sheetRef.current.style.transform = "translateY(0px)";
        offsetRef.current = 0;
      }
    }
  }, [expanded, animateClose]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handlePointerDown(e.touches[0].clientY);
  }, [handlePointerDown]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    handlePointerMove(e.touches[0].clientY);
  }, [handlePointerMove]);

  const onTouchEnd = useCallback(() => {
    handlePointerUp();
  }, [handlePointerUp]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handlePointerDown(e.clientY);
    const handleMouseMove = (ev: MouseEvent) => handlePointerMove(ev.clientY);
    const handleMouseUp = () => {
      handlePointerUp();
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [handlePointerDown, handlePointerMove, handlePointerUp]);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    sheet.style.transition = "none";
    sheet.style.transform = "translateY(100%)";
    requestAnimationFrame(() => {
      sheet.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
      sheet.style.transform = "translateY(0px)";
    });
  }, []);

  if (!content) return null;

  // Gaya statis (height tidak berubah saat drag)
  const sheetStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 0,
    left: expanded ? 0 : sidebarWidth,
    right: 0,
    height: expanded ? "100dvh" : "90vh",
    maxHeight: "100dvh",
    backgroundColor: "#fdf6f0",
    backdropFilter: "blur(30px)",
    WebkitBackdropFilter: "blur(30px)",
    borderTopLeftRadius: expanded ? 0 : 36,
    borderTopRightRadius: expanded ? 0 : 36,
    boxShadow: expanded ? "none" : "0 -8px 32px rgba(0,0,0,0.15)",
    zIndex: 30,
    display: "flex",
    flexDirection: "column",
    transform: "translateY(0px)",
    transition: expanded
      ? "border-radius 0.3s ease, box-shadow 0.3s ease"
      : "border-radius 0.3s ease, box-shadow 0.3s ease",
    touchAction: expanded ? "auto" : "none", // handle akan override
    overscrollBehavior: expanded ? "none" : "contain",
  };

  // Padding aman untuk area teks
  const contentPadding = expanded
    ? `calc(env(safe-area-inset-top) + 72px) 16px calc(env(safe-area-inset-bottom) + 24px)`
    : "0 16px 24px 16px";

  return (
    <>
      <div
        onClick={expanded ? undefined : animateClose}
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          left: expanded ? 0 : sidebarWidth,
          right: 0,
          backgroundColor: "rgba(0,0,0,0.2)",
          zIndex: 25,
          animation: "fadeInSlow 0.5s ease forwards",
        }}
      />
      <div ref={sheetRef} style={sheetStyle}>
        {/* Gagang (hanya saat normal) */}
        {!expanded && (
          <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
            onMouseDown={onMouseDown}
            style={{
              display: "flex",
              justifyContent: "center",
              height: 36,
              flexShrink: 0,
              touchAction: "none",
              cursor: "grab",
              paddingTop: 10,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                width: 40,
                height: 5,
                borderRadius: 3,
                backgroundColor: "rgba(158, 149, 141, 0.42)",
              }}
            />
          </div>
        )}

        {/* Tombol kembali (expanded) – dengan safe area */}
        {expanded && (
          <button
            onTouchStart={() => setBackPressed(true)}
            onTouchEnd={() => {
              setBackPressed(false);
              collapseFromFullscreen();
            }}
            onTouchCancel={() => setBackPressed(false)}
            onMouseDown={() => setBackPressed(true)}
            onMouseUp={() => {
              setBackPressed(false);
              collapseFromFullscreen();
            }}
            onMouseLeave={() => setBackPressed(false)}
            style={{
              position: "absolute",
              top: `calc(env(safe-area-inset-top) + 16px)`,
              left: 16,
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "1px solid rgba(0,0,0,0.08)",
              backgroundColor: backPressed ? "rgba(0,0,0,0.06)" : "#fdf6f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 35,
              transform: backPressed ? "scale(1.1)" : "scale(1)",
              transition: "transform 0.15s ease, background-color 0.15s ease",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
          </button>
        )}

        {/* Area teks */}
        <div
          style={{
            flex: 1,
            fontFamily: "'Literata', serif",
            fontSize: 24,
            fontWeight: 700,
            lineHeight: 1.45,
            letterSpacing: "-0.02em",
            color: "#1a1a1a",
            overflowY: "auto",
            whiteSpace: "normal",
            overflowWrap: "break-word",
            padding: contentPadding,
            userSelect: "text",
            WebkitUserSelect: "text",
          }}
        >
          {content}
        </div>
      </div>
      <style>{`
        @keyframes fadeInSlow {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
};
