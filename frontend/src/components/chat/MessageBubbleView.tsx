// frontend/src/components/chat/MessageBubbleView.tsx

import React from "react";

export interface MessageBubbleViewProps {
  content: string;
  isUser?: boolean;
}

export const MessageBubbleView: React.FC<MessageBubbleViewProps> = ({
  content,
  isUser = true,
}) => {
  if (!isUser) {
    return (
      <div style={{
        padding: "8px 0",
        color: "#1a1a1a",
        fontSize: 24,
        fontWeight: 700,
        lineHeight: 1.45,
        whiteSpace: "normal",
        overflowWrap: "break-word",
      }}>
        {content}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "10px 16px",
        borderRadius: "14px",
        backgroundColor: "rgba(217, 137, 106, 0.74)",
        border: "1px solid rgba(255, 255, 255, 0.28)",
        color: "#FFF8F4",
        fontSize: 24,
        fontWeight: 700,
        lineHeight: 1.45,
        letterSpacing: "-0.02em",
        fontFamily: "'Literata', serif",
        whiteSpace: "normal",
        wordBreak: "break-word",
        boxShadow: "0 4px 12px rgba(120, 70, 50, 0.10)",
        userSelect: "none",          // ← cegah selection
        WebkitUserSelect: "none",    // ← cegah selection (Safari)
      }}
    >
      {content}
    </div>
  );
};
