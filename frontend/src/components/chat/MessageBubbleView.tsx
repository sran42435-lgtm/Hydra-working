// frontend/src/components/chat/MessageBubbleView.tsx

import React from "react";

export interface MessageBubbleViewProps {
  content: string;
  isUser?: boolean;
  pressed?: boolean;
}

export const MessageBubbleView: React.FC<MessageBubbleViewProps> = ({
  content,
  isUser = true,
  pressed = false,
}) => {
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
        padding: "6px 12px",           // <-- lebih kecil
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
      {content}
    </div>
  );
};
