import React, { useEffect, useRef, useCallback } from "react";

interface AIMessageSheetProps {
  content: string;
  onClose: () => void;
}

const CLOSE_THRESHOLD = 150; // px
const VELOCITY_THRESHOLD = 0.5; // px/ms

export const AIMessageSheet: React.FC<AIMessageSheetProps> = ({ content, onClose }) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Drag state (all refs to avoid re-renders)
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const offsetRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Close when tapping outside the sheet
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        animateClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Animate sheet to a given offset, then optionally close
  const animateTo = useCallback((targetY: number, onComplete?: () => void) => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    sheet.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
    sheet.style.transform = `translateY(${targetY}px)`;
    offsetRef.current = targetY;

    if (onComplete) {
      const handleTransitionEnd = () => {
        sheet.removeEventListener("transitionend", handleTransitionEnd);
        onComplete();
      };
      sheet.addEventListener("transitionend", handleTransitionEnd);
    }
  }, []);

  const animateClose = useCallback(() => {
    const sheet = sheetRef.current;
    if (!sheet) {
      onClose();
      return;
    }
    sheet.style.transition = "transform 0.3s ease-in";
    sheet.style.transform = "translateY(100%)";
    const handleTransitionEnd = () => {
      sheet.removeEventListener("transitionend", handleTransitionEnd);
      onClose();
    };
    sheet.addEventListener("transitionend", handleTransitionEnd);
  }, [onClose]);

  // Start drag
  const handlePointerDown = useCallback((clientY: number) => {
    if (!sheetRef.current) return;
    draggingRef.current = true;
    startYRef.current = clientY;
    lastYRef.current = clientY;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;

    // Cancel any ongoing animation
    sheetRef.current.style.transition = "none";
    // Start from current offset (if already dragged)
    sheetRef.current.style.transform = `translateY(${offsetRef.current}px)`;
  }, []);

  // Move – compute velocity & update DOM directly
  const handlePointerMove = useCallback((clientY: number) => {
    if (!draggingRef.current || !sheetRef.current) return;
    const now = Date.now();
    const dt = now - lastTimeRef.current;
    lastTimeRef.current = now;

    const rawDiff = clientY - startYRef.current;
    // Rubber‑band if pulling beyond screen (negative diff not allowed)
    const diff = Math.max(0, rawDiff);

    if (dt > 0) {
      velocityRef.current = (clientY - lastYRef.current) / dt; // px/ms
    }
    lastYRef.current = clientY;

    offsetRef.current = diff;
    sheetRef.current.style.transform = `translateY(${diff}px)`;
  }, []);

  // End drag – decide action based on offset & velocity
  const handlePointerUp = useCallback(() => {
    if (!draggingRef.current || !sheetRef.current) return;
    draggingRef.current = false;

    const finalOffset = offsetRef.current;
    const finalVelocity = velocityRef.current;

    // Close if dragged far enough OR swiped fast enough
    if (finalOffset > CLOSE_THRESHOLD || finalVelocity > VELOCITY_THRESHOLD) {
      animateClose();
    } else {
      // Snap back to open
      animateTo(0);
    }
  }, [animateClose, animateTo]);

  // Touch events
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handlePointerDown(e.touches[0].clientY);
  }, [handlePointerDown]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    handlePointerMove(e.touches[0].clientY);
  }, [handlePointerMove]);

  const onTouchEnd = useCallback(() => {
    handlePointerUp();
  }, [handlePointerUp]);

  // Mouse events
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

  // Initial slide‑up animation (no keyframes to avoid conflict)
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    // Start from below
    sheet.style.transition = "none";
    sheet.style.transform = "translateY(100%)";
    // Trigger slide up
    requestAnimationFrame(() => {
      sheet.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
      sheet.style.transform = "translateY(0px)";
    });
  }, []);

  if (!content) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={animateClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.2)",
          zIndex: 25,
          animation: "fadeInSlow 0.5s ease forwards",
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "90vh",
          backgroundColor: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          borderTopLeftRadius: 36,
          borderTopRightRadius: 36,
          boxShadow: "0 -8px 32px rgba(0,0,0,0.15)",
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
          transform: "translateY(100%)", // initial (will be animated in effect)
          touchAction: "auto",
        }}
      >
        {/* Drag zone */}
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
          <div style={{
            width: 40,
            height: 5,
            borderRadius: 3,
            backgroundColor: "rgba(59, 130, 246, 0.6)",
          }} />
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            fontFamily: "'Nunito', sans-serif",
            fontSize: 22,
            fontWeight: 900,
            lineHeight: 1.5,
            color: "#1a1a1a",
            overflowY: "auto",
            whiteSpace: "normal",
            overflowWrap: "break-word",
            padding: "0 16px 24px 16px",
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
