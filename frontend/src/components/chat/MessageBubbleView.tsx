// frontend/src/components/chat/MessageBubbleView.tsx

import React, { useState } from "react";

export interface MessageBubbleViewProps {
  content: string;
  isUser?: boolean;
  pressed?: boolean;
}

const MAX_CHAR_PREVIEW = 280;

export const MessageBubbleView: React.FC<MessageBubbleViewProps> = ({
  content,
  isUser = true,
  pressed = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Hanya untuk pesan user
  const isLong = isUser && content.length > MAX_CHAR_PREVIEW;
  const displayContent = isUser && isLong && !expanded
    ? content.slice(0, MAX_CHAR_PREVIEW) + "..."
    : content;

  if (!isUser) {
    return (
      <div
        style={{
          padding: "8px 0",
          color: "#1a1a1a",
          fontSize: 24,
          fontWeight: 700,
          lineHeight: 1.45,
          whiteSpace: "normal",
          overflowWrap: "break-word",
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "6px 12px",
        borderRadius: "14px",
        backgroundColor: pressed
          ? "rgba(205, 125, 96, 0.74)"
          : "rgba(217, 137, 106, 0.74)",
        border: "1px solid rgba(0,0,0,0.15)",
        color: "#1a1a1a",
        fontSize: 24,
        fontWeight: 700,
        lineHeight: 1.45,
        letterSpacing: "-0.02em",
        fontFamily: "'Literata', serif",
        whiteSpace: "normal",
        wordBreak: "break-word",
        boxShadow: "0 4px 12px rgba(120, 70, 50, 0.10)",
        userSelect: "none",
        WebkitUserSelect: "none",
        opacity: pressed ? 0.88 : 1,
        filter: pressed ? "brightness(0.95)" : "brightness(1)",
        transition:
          "opacity 0.12s ease, filter 0.12s ease, background-color 0.12s ease",
      }}
    >
      <span>{displayContent}</span>
      {isLong && !expanded && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(true);
          }}
          style={{
            color: "rgba(255, 255, 255, 0.85)",
            fontSize: 18,
            fontWeight: 600,
            fontFamily: "'Literata', serif",
            cursor: "pointer",
            marginLeft: 6,
            textDecoration: "underline",
            textUnderlineOffset: 3,
            whiteSpace: "nowrap",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          lihat selengkapnya
        </span>
      )}
      {isLong && expanded && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(false);
          }}
          style={{
            color: "rgba(255, 255, 255, 0.85)",
            fontSize: 18,
            fontWeight: 600,
            fontFamily: "'Literata', serif",
            cursor: "pointer",
            marginLeft: 6,
            textDecoration: "underline",
            textUnderlineOffset: 3,
            whiteSpace: "nowrap",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          sembunyikan
        </span>
      )}
    </div>
  );
};
