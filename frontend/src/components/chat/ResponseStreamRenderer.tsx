/**
 * Response Stream Renderer - Phase 1
 * Menampilkan teks respons dari AI dengan efek mengetik (simulasi streaming).
 * Siap digunakan untuk streaming asli di Phase 2.
 */

import React, { useState, useEffect, useRef } from "react";
import { MarkdownContentRenderer } from "./MarkdownContentRenderer";

export interface ResponseStreamRendererProps {
  /** Teks lengkap yang akan ditampilkan */
  content: string;
  /** Apakah sedang dalam mode streaming */
  isStreaming: boolean;
  /** Delay antar karakter dalam milidetik (untuk simulasi mengetik) */
  typingSpeed?: number;
  /** Callback saat animasi mengetik selesai */
  onTypingComplete?: () => void;
}

export const ResponseStreamRenderer: React.FC<ResponseStreamRendererProps> = ({
  content,
  isStreaming,
  typingSpeed = 20,
  onTypingComplete,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const indexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Reset saat content berubah
    indexRef.current = 0;
    setDisplayedText("");

    if (!content) return;

    if (!isStreaming) {
      // Mode non-streaming: tampilkan langsung
      setDisplayedText(content);
      onTypingComplete?.();
      return;
    }

    // Mode streaming (simulasi mengetik)
    intervalRef.current = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current >= content.length) {
        setDisplayedText(content);
        if (intervalRef.current) clearInterval(intervalRef.current);
        onTypingComplete?.();
      } else {
        setDisplayedText(content.slice(0, indexRef.current));
      }
    }, typingSpeed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [content, isStreaming, typingSpeed, onTypingComplete]);

  return (
    <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      <MarkdownContentRenderer content={displayedText} />
      {isStreaming && displayedText.length < content.length && (
        <Cursor />
      )}
    </div>
  );
};

/** Kursor berkedip untuk efek mengetik */
const Cursor: React.FC = () => (
  <span
    style={{
      display: "inline-block",
      width: "8px",
      height: "16px",
      backgroundColor: "#94a3b8",
      marginLeft: "2px",
      animation: "blink 1s step-end infinite",
      verticalAlign: "middle",
    }}
  />
);

/*
 * Animasi blink untuk kursor.
 * Tambahkan ini di CSS global:
 *
 * @keyframes blink {
 *   50% { opacity: 0; }
 * }
 */
