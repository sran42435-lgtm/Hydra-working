// components/chat/ShareSheet.tsx

import React, { useEffect, useRef, useCallback } from 'react';

interface ShareSheetProps {
  content: string;
  userPrompt?: string;
  onClose: () => void;
  onShareExternal: () => void;
  onCopyText: () => void;
  onExportMarkdown: () => void;
}

const CLOSE_THRESHOLD = 150;
const VELOCITY_THRESHOLD = 0.5;

// Ikon untuk tombol fitur
const ClipboardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </svg>
);

const ShareIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
    <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
  </svg>
);

const ExportIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

export const ShareSheet: React.FC<ShareSheetProps> = ({
  content,
  userPrompt,
  onClose,
  onShareExternal,
  onCopyText,
  onExportMarkdown,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const offsetRef = useRef(0);

  const animateTo = useCallback((targetY: number, onComplete?: () => void) => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    sheet.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    sheet.style.transform = `translateY(${targetY}px)`;
    offsetRef.current = targetY;
    if (onComplete) {
      const handler = () => {
        sheet.removeEventListener('transitionend', handler);
        onComplete();
      };
      sheet.addEventListener('transitionend', handler);
    }
  }, []);

  const animateClose = useCallback(() => {
    const sheet = sheetRef.current;
    if (!sheet) {
      onClose();
      return;
    }
    sheet.style.transition = 'transform 0.3s ease-in';
    sheet.style.transform = 'translateY(100%)';
    const handler = () => {
      sheet.removeEventListener('transitionend', handler);
      onClose();
    };
    sheet.addEventListener('transitionend', handler);
  }, [onClose]);

  const handlePointerDown = useCallback((clientY: number) => {
    if (!sheetRef.current) return;
    draggingRef.current = true;
    startYRef.current = clientY;
    lastYRef.current = clientY;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
    sheetRef.current.style.transition = 'none';
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
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handlePointerDown, handlePointerMove, handlePointerUp]);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    sheet.style.transition = 'none';
    sheet.style.transform = 'translateY(100%)';
    requestAnimationFrame(() => {
      sheet.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      sheet.style.transform = 'translateY(0px)';
    });
  }, []);

  const chatFont = "'Literata', serif";

  // Warna bubble pengguna dari MessageBubbleView
  const userBubbleBg = 'rgba(217, 137, 106, 0.74)';
  const userBubbleBorder = '1px solid rgba(255, 255, 255, 0.28)';
  const userBubbleTextColor = '#FFF8F4';

  return (
    <>
      {/* backdrop */}
      <div
        onClick={animateClose}
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0,0,0,0.2)',
          zIndex: 35,
          animation: 'fadeInSlow 0.5s ease forwards',
        }}
      />

      {/* sheet */}
      <div
        ref={sheetRef}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '85vh',
          backgroundColor: '#fdf6f0',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderTopLeftRadius: 36,
          borderTopRightRadius: 36,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          transform: 'translateY(100%)',
          touchAction: 'pan-y',          // hanya izinkan geser vertikal
        }}
      >
        {/* drag handle */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          onMouseDown={onMouseDown}
          style={{
            display: 'flex',
            justifyContent: 'center',
            height: 36,
            flexShrink: 0,
            touchAction: 'none',
            cursor: 'grab',
            paddingTop: 10,
            boxSizing: 'border-box',
          }}
        >
          <div style={{
            width: 40,
            height: 5,
            borderRadius: 3,
            backgroundColor: 'rgba(158, 149, 141, 0.42)',
          }} />
        </div>

        {/* header blur di atas konten */}
        <div style={{
          position: 'absolute',
          top: 36,
          left: 0,
          right: 0,
          height: 60,
          background: 'linear-gradient(to bottom, #fdf6f0 0%, #fdf6f0 60%, rgba(253, 246, 240, 0) 100%)',
          maskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }} />

        {/* area konten percakapan (scrollable) – teks pengguna diturunkan */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',              // cegah geser horizontal
          padding: '80px 16px 0 16px',      // atas diperbesar agar teks terlihat
          fontFamily: chatFont,
          fontSize: 22,
          fontWeight: 700,
          lineHeight: 1.45,
          letterSpacing: '-0.02em',
          color: '#1a1a1a',
        }}>
          {/* User message – rata kanan */}
          {userPrompt && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: 12,
            }}>
              <div style={{
                maxWidth: '80%',
                textAlign: 'right',
                padding: '8px 14px',
                borderRadius: 18,
                backgroundColor: userBubbleBg,
                border: userBubbleBorder,
                color: userBubbleTextColor,
              }}>
                {userPrompt}
              </div>
            </div>
          )}

          {/* AI response – rata kiri, tanpa bubble */}
          <div style={{
            marginBottom: 24,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
          }}>
            {content}
          </div>
        </div>

        {/* Pembatas blur antara area teks dan footer */}
        <div style={{
          height: 20,
          background: 'linear-gradient(to bottom, #fdf6f0 0%, #fdf6f0 60%, rgba(253, 246, 240, 0) 100%)',
          maskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
          flexShrink: 0,
        }} />

        {/* footer tombol fitur (dinaikkan sedikit) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-evenly',
          alignItems: 'center',
          padding: '8px 8px',               // dikurangi dari 12px
          backgroundColor: '#fdf6f0',
          borderBottomLeftRadius: 36,
          borderBottomRightRadius: 36,
          gap: 12,
          flexShrink: 0,
        }}>
          {/* Copy text */}
          <button
            onClick={() => { onCopyText(); onClose(); }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '12px 8px',
              border: userBubbleBorder,
              borderRadius: 14,
              backgroundColor: userBubbleBg,
              color: userBubbleTextColor,
              fontFamily: chatFont,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ClipboardIcon />
            <span>Copy text</span>
          </button>

          {/* Share */}
          <button
            onClick={() => { onShareExternal(); onClose(); }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '12px 8px',
              border: userBubbleBorder,
              borderRadius: 14,
              backgroundColor: userBubbleBg,
              color: userBubbleTextColor,
              fontFamily: chatFont,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ShareIcon />
            <span>Share</span>
          </button>

          {/* Export Markdown */}
          <button
            onClick={() => { onExportMarkdown(); onClose(); }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '12px 8px',
              border: userBubbleBorder,
              borderRadius: 14,
              backgroundColor: userBubbleBg,
              color: userBubbleTextColor,
              fontFamily: chatFont,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ExportIcon />
            <span>Export MD</span>
          </button>
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
