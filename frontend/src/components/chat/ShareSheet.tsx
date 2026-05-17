// components/chat/ShareSheet.tsx

import React, { useState, useEffect } from 'react';

interface ShareSheetProps {
  x: number;
  y: number;
  content: string;
  userPrompt?: string;
  onClose: () => void;
  onShareExternal: () => void;
  onCopyText: () => void;
  onExportMarkdown: () => void;
}

export const ShareSheet: React.FC<ShareSheetProps> = ({
  x,
  y,
  content,
  userPrompt,
  onClose,
  onShareExternal,
  onCopyText,
  onExportMarkdown,
}) => {
  const chatFont = "'Literata', serif";
  const [hasAppeared, setHasAppeared] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHasAppeared(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const animation = hasAppeared
    ? 'none'
    : 'liquidGlassPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';

  const sheetBase: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    transform: 'translate(-50%, -50%) scale(1)',
    minWidth: 220,
    maxWidth: 300,
    backgroundColor: '#fdf6f0',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRadius: 16,
    boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
    border: '1px solid rgba(0,0,0,0.04)',
    padding: '8px 0 4px 0',
    zIndex: 31,
    cursor: 'default',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
    animation,
  };

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#1a1a1a',
    fontFamily: chatFont,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
  };

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 29,
          backgroundColor: 'transparent',
        }}
      />
      <div style={sheetBase}>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => {
            onCopyText();
            onClose();
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = 'transparent')
          }
        >
          <span>Copy text</span>
          <ClipboardIcon />
        </button>

        <div style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.05)', margin: '2px 0' }} />

        <button
          type="button"
          style={buttonStyle}
          onClick={() => {
            onShareExternal();
            onClose();
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = 'transparent')
          }
        >
          <span>Share</span>
          <ShareIcon />
        </button>

        <div style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.05)', margin: '2px 0' }} />

        <button
          type="button"
          style={buttonStyle}
          onClick={() => {
            onExportMarkdown();
            onClose();
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = 'transparent')
          }
        >
          <span>Export Markdown</span>
          <ExportIcon />
        </button>
      </div>
    </>
  );
};

// --- Ikon (sama seperti sebelumnya) ---
const ClipboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </svg>
);

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
    <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
  </svg>
);

const ExportIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);
