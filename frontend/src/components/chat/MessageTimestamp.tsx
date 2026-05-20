// frontend/src/components/chat/MessageTimestamp.tsx

import React, { useState, useEffect, useRef } from "react";

interface MessageTimestampProps {
  timestamp: number; // Unix epoch dalam milidetik
  animate?: boolean; // bila true, tampilkan karakter satu per satu
}

export const MessageTimestamp: React.FC<MessageTimestampProps> = ({
  timestamp,
  animate = false,
}) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const fullTime = `${hours}.${minutes}`;

  const [displayed, setDisplayed] = useState(animate ? "" : fullTime);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!animate) {
      setDisplayed(fullTime);
      return;
    }

    // Reset jika timestamp berubah
    indexRef.current = 0;
    setDisplayed("");

    timerRef.current = setInterval(() => {
      setDisplayed((prev) => {
        const nextIndex = prev.length;
        if (nextIndex >= fullTime.length) {
          if (timerRef.current) clearInterval(timerRef.current);
          return prev;
        }
        return fullTime.slice(0, nextIndex + 1);
      });
    }, 120); // jeda 120ms per karakter

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fullTime, animate]);

  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 400,
        color: "#888",
        fontFamily: "'Literata', serif",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {displayed || (animate ? "\u00A0" : fullTime)}
    </span>
  );
};
