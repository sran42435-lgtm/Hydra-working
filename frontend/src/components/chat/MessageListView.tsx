import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { chatStore, Message } from "../../store/chat_state_store";
import { HydraIcon } from "../ui/HydraIcon";
import { ThinkingBubble } from "./ThinkingBubble";

interface MessageListViewProps {
  isLoading: boolean;
}

const ScrollDownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ClipboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const MessageListView: React.FC<MessageListViewProps> = ({ isLoading }) => {
  const [messages, setMessages] = useState<Message[]>(chatStore.getState().messages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = chatStore.subscribe(() =>
      setMessages([...chatStore.getState().messages])
    );
    return () => {
      unsubscribe();
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  // Merge consecutive assistant messages into one paragraph
  const mergedMessages = useMemo(() => {
    const result: Message[] = [];
    for (let i = 0; i < messages.length; i++) {
      const current = messages[i];
      if (current.id.endsWith("_stopped")) {
        result.push(current);
        continue;
      }
      if (current.role === "assistant") {
        const prev = result[result.length - 1];
        if (prev && prev.role === "assistant" && !prev.id.endsWith("_stopped")) {
          prev.content += " " + current.content;
          prev.id = current.id;
          continue;
        }
      }
      result.push({ ...current });
    }
    return result;
  }, [messages]);

  // Auto‑scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mergedMessages]);

  // Detect if user has scrolled up, and track active scrolling
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const threshold = 50;
    const atBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    setIsAtBottom(atBottom);

    setIsScrolling(true);

    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 0);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, [handleScroll]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Robust copy with fallback
  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // fallback below
    }
    // Fallback for older browsers / non‑HTTPS
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const handleCopy = async (content: string, id: string) => {
    const success = await copyToClipboard(content);
    if (success) {
      setCopiedId(id);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Button visible when NOT at bottom AND NOT actively scrolling
  const showScrollButton = !isAtBottom && !isScrolling;

  // Determine the ID of the last assistant message (being streamed)
  const lastAssistantMessageId = useMemo(() => {
    for (let i = mergedMessages.length - 1; i >= 0; i--) {
      if (mergedMessages[i].role === "assistant" && !mergedMessages[i].id.endsWith("_stopped")) {
        return mergedMessages[i].id;
      }
    }
    return null;
  }, [mergedMessages]);

  return (
    <div
      ref={scrollContainerRef}
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "60px 16px 110px",
        backgroundColor: "#fafafa",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes scaleIn {
          0% { transform: translateX(-50%) scale(0); opacity: 0; }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        @keyframes drawLine {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
      `}</style>

      {mergedMessages.length === 0 && !isLoading && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "#1a1a1a",
          textAlign: "center",
        }}>
          <HydraIcon size={48} />
          <p style={{ marginTop: 12, color: "#1a1a1a" }}>Kirim pesan untuk memulai</p>
        </div>
      )}

      {mergedMessages.map((msg) => {
        const isStoppedMessage = msg.id.endsWith("_stopped");

        if (isStoppedMessage) {
          return (
            <div key={msg.id} style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 12,
              paddingRight: 4,
            }}>
              <span style={{
                color: "#999",
                fontStyle: "italic",
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                fontWeight: 500,
              }}>
                {msg.content}
              </span>
            </div>
          );
        }

        if (msg.role === "assistant") {
          const cleanContent = msg.content.replace(/[\r\n]+/g, " ").trim();
          const isCopied = copiedId === msg.id;
          const isStreamingThis = isLoading && msg.id === lastAssistantMessageId;

          return (
            <div key={msg.id} style={{
              marginBottom: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}>
              {/* AI text */}
              <div style={{
                width: "100%",
                padding: "8px 0 0 0",
                color: "#1a1a1a",
                fontFamily: "'Outfit', sans-serif",
                fontSize: 18,
                fontWeight: 900,
                lineHeight: 1.5,
                whiteSpace: "normal",
                overflowWrap: "break-word",
              }}>
                {cleanContent}
              </div>

              {/* Boundary line + copy button appear only after streaming finishes */}
              {cleanContent && !isStreamingThis && (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  {/* Animated boundary line */}
                  <div style={{
                    width: "100%",
                    height: 1,
                    marginTop: 8,
                    backgroundColor: "rgba(0,0,0,0.05)",
                    transformOrigin: "left center",
                    animation: "drawLine 0.4s ease forwards",
                  }} />

                  {/* Copy button – icon only, below the line, with increased click area */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(cleanContent, msg.id);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 8,
                      padding: 8,
                      border: "none",
                      borderRadius: 6,
                      backgroundColor: "transparent",
                      color: isCopied ? "#4CAF50" : "#999",
                      cursor: "pointer",
                      transition: "color 0.15s ease",
                      fontSize: 16,
                      lineHeight: 1,
                    }}
                    aria-label="Salin pesan"
                  >
                    {isCopied ? <CheckIcon /> : <ClipboardIcon />}
                  </button>
                </div>
              )}
            </div>
          );
        }

        // User message
        return (
          <div key={msg.id} style={{
            marginBottom: 12,
            display: "flex",
            justifyContent: "flex-end",
          }}>
            <div style={{
              maxWidth: "75%",
              padding: "12px 18px",
              borderRadius: 20,
              backgroundColor: "rgba(224,123,90,0.75)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "#fff",
              borderTopRightRadius: 4,
              borderTopLeftRadius: 20,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 18,
              fontWeight: 900,
              lineHeight: 1.5,
              whiteSpace: "normal",
              overflowWrap: "break-word",
              border: "1px solid rgba(255,255,255,0.5)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}>
              {msg.content}
            </div>
          </div>
        );
      })}

      {/* Thinking bubble appears when loading */}
      <ThinkingBubble isLoading={isLoading} />

      {/* Invisible element for auto‑scroll */}
      <div ref={bottomRef} />

      {/* Scroll‑to‑bottom floating button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          style={{
            position: "sticky",
            bottom: 16,
            left: "50%",
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "1px solid rgba(0,0,0,0.04)",
            backgroundColor: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#1a1a1a",
            zIndex: 6,
            transform: "translateX(-50%) scale(1)",
            animation: "scaleIn 0.25s ease forwards",
          }}
        >
          <ScrollDownIcon />
        </button>
      )}
    </div>
  );
};

export default MessageListView;
