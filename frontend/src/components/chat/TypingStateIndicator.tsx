/**
 * Typing State Indicator - Phase 1
 * Menampilkan indikator animasi saat AI sedang mengetik respons.
 */

import React from "react";

export interface TypingStateIndicatorProps {
  isTyping: boolean;
}

export const TypingStateIndicator: React.FC<TypingStateIndicatorProps> = ({
  isTyping,
}) => {
  if (!isTyping) return null;

  return (
    <div style={containerStyle}>
      <div style={dotStyle} />
      <div style={{ ...dotStyle, animationDelay: "0.2s" }} />
      <div style={{ ...dotStyle, animationDelay: "0.4s" }} />
    </div>
  );
};

// Inline styles sederhana (bisa diganti CSS module di kemudian hari)
const containerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  padding: "8px 16px",
};

const dotStyle: React.CSSProperties = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  backgroundColor: "#94a3b8",
  animation: "typingBounce 1.4s ease-in-out infinite",
};
