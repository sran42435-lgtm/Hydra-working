// frontend/src/components/chat/ActionBoard.tsx

import React, { useState } from "react";

/* ---------- ikon yang sama ---------- */
const ClipboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </svg>
);

const PencilLineIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 21h8" />
    <path d="m15 5 4 4" />
    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
  </svg>
);

const RetryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

/* ---------- Props ---------- */
interface ActionBoardProps {
  x: number;
  y: number;
  content: string;
  messageId: string;
  boardActiveScale: number;
  boardAnimation: string;
  isDraggingBoard: boolean;
  isBoardPressed: boolean;
  /** drag handle events & style */
  handleStyle: React.CSSProperties;
  handlePillStyle: React.CSSProperties;
  onDragStart: (e: React.TouchEvent | React.MouseEvent) => void;
  onDragMove: (e: React.TouchEvent | React.MouseEvent) => void;
  onDragEnd: () => void;
  onCopy: (content: string, id: string) => void;
  onEdit: (content: string, id: string) => void;
  onRetry: (content: string, id: string) => void;
}

export const ActionBoard: React.FC<ActionBoardProps> = ({
  x,
  y,
  content,
  messageId,
  boardActiveScale,
  boardAnimation,
  isDraggingBoard,
  isBoardPressed,
  handleStyle,
  handlePillStyle,
  onDragStart,
  onDragMove,
  onDragEnd,
  onCopy,
  onEdit,
  onRetry,
}) => {
  const chatFont = "'Literata', serif";
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  const ACTION_BOARD_BASE_STYLE: React.CSSProperties = {
    position: "fixed",
    minWidth: 180,
    backgroundColor: "#fdf6f0",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    borderRadius: 14,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    border: "1px solid rgba(0,0,0,0.04)",
    padding: "0 0 4px 0",
    zIndex: 21,
    cursor: "default",
    userSelect: "none",
    WebkitUserSelect: "none",
    touchAction: "none",
  };

  const buttonBase: React.CSSProperties = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    border: "none",
    color: "#1a1a1a",
    fontFamily: chatFont,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    backgroundColor: "transparent",
    transform: "scale(1)",
    transition: "transform 0.15s ease, background-color 0.15s ease",
    borderRadius: 0,
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        ...ACTION_BOARD_BASE_STYLE,
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${boardActiveScale})`,
        transition: "transform 0.15s ease",
        animation: boardAnimation,
        opacity: isDraggingBoard || isBoardPressed ? 1 : undefined,
      }}
    >
      {/* drag handle */}
      <div
        onTouchStart={(e) => {
          e.stopPropagation();
          onDragStart(e);
        }}
        onTouchMove={(e) => {
          e.stopPropagation();
          onDragMove(e);
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          onDragEnd();
        }}
        onTouchCancel={(e) => {
          e.stopPropagation();
          onDragEnd();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onDragStart(e);
        }}
        onMouseMove={(e) => {
          e.stopPropagation();
          onDragMove(e);
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          onDragEnd();
        }}
        onMouseLeave={(e) => {
          e.stopPropagation();
          onDragEnd();
        }}
        style={handleStyle}
      >
        <div style={handlePillStyle} />
      </div>

      {/* Copy */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onCopy(content, messageId);
        }}
        onTouchStart={() => setPressedButton('copy')}
        onTouchEnd={() => setPressedButton(null)}
        onTouchCancel={() => setPressedButton(null)}
        onMouseDown={() => setPressedButton('copy')}
        onMouseUp={() => setPressedButton(null)}
        onMouseLeave={() => setPressedButton(null)}
        style={{
          ...buttonBase,
          backgroundColor: pressedButton === 'copy' ? 'rgba(0,0,0,0.08)' : 'transparent',
          transform: pressedButton === 'copy' ? 'scale(0.96)' : 'scale(1)',
        }}
      >
        <span>Copy message</span>
        <ClipboardIcon />
      </button>

      <div style={{ height: 1, backgroundColor: "rgba(0,0,0,0.05)", margin: "2px 0" }} />

      {/* Edit */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(content, messageId);
        }}
        onTouchStart={() => setPressedButton('edit')}
        onTouchEnd={() => setPressedButton(null)}
        onTouchCancel={() => setPressedButton(null)}
        onMouseDown={() => setPressedButton('edit')}
        onMouseUp={() => setPressedButton(null)}
        onMouseLeave={() => setPressedButton(null)}
        style={{
          ...buttonBase,
          backgroundColor: pressedButton === 'edit' ? 'rgba(0,0,0,0.08)' : 'transparent',
          transform: pressedButton === 'edit' ? 'scale(0.96)' : 'scale(1)',
        }}
      >
        <span>Edit</span>
        <PencilLineIcon />
      </button>

      <div style={{ height: 1, backgroundColor: "rgba(0,0,0,0.05)", margin: "2px 0" }} />

      {/* Retry */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRetry(content, messageId);
        }}
        onTouchStart={() => setPressedButton('retry')}
        onTouchEnd={() => setPressedButton(null)}
        onTouchCancel={() => setPressedButton(null)}
        onMouseDown={() => setPressedButton('retry')}
        onMouseUp={() => setPressedButton(null)}
        onMouseLeave={() => setPressedButton(null)}
        style={{
          ...buttonBase,
          backgroundColor: pressedButton === 'retry' ? 'rgba(0,0,0,0.08)' : 'transparent',
          transform: pressedButton === 'retry' ? 'scale(0.96)' : 'scale(1)',
        }}
      >
        <span>Retry</span>
        <RetryIcon />
      </button>
    </div>
  );
};
