import React, { useEffect, useRef, useCallback } from "react";

interface AIMessageSheetProps {
  content: string;
  onClose: () => void;
  isDesktop?: boolean;
}

const CLOSE_THRESHOLD = 150;
const VELOCITY_THRESHOLD = 0.5;

export const AIMessageSheet: React.FC<AIMessageSheetProps> = ({ content, onClose, isDesktop = false }) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const offsetRef = useRef(0);

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

  const handlePointerDown = useCallback((clientY: number) => {
    if (!sheetRef.current) return;
    draggingRef.current = true;
    startYRef.current = clientY;
    lastYRef.current = clientY;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
    sheetRef.current.style.transition = "none";
    sheetRef.current.style.transform = `translateY(${offsetRef.current}px)`;
  }, []);

  const handlePointerMove = useCallback((clientY: number) => {
    if (!draggingRef.current || !sheetRef.current) return;
    const now = Date.now();
    const dt = now - lastTimeRef.current;
    lastTimeRef.current = now;
    const rawDiff = clientY - startYRef.current;
    const diff = Math.max(0, rawDiff);
    if (dt > 0) velocityRef.current = (clientY - lastYRef.current) / dt;
    lastYRef.current = clientY;
    offsetRef.current = diff;
    sheetRef.current.style.transform = `translateY(${diff}px)`;
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!draggingRef.current || !sheetRef.current) return;
    draggingRef.current = false;
    const finalOffset = offsetRef.current;
    const finalVelocity = velocityRef.current;
    if (finalOffset > CLOSE_THRESHOLD || finalVelocity > VELOCITY_THRESHOLD) {
      animateClose();
    } else {
      animateTo(0);
    }
  }, [animateClose, animateTo]);

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

  const sidebarWidth = isDesktop ? 260 : 0;

  return (
    <>
      <div
        ref={backdropRef}
        onClick={animateClose}
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          left: sidebarWidth,
          right: 0,
          backgroundColor: "rgba(0,0,0,0.2)",
          zIndex: 25,
          animation: "fadeInSlow 0.5s ease forwards",
        }}
      />
      <div
        ref={sheetRef}
        style={{
          position: "fixed",
          bottom: 0,
          left: sidebarWidth,
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
          transform: "translateY(100%)",
          touchAction: "auto",
        }}
      >
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
