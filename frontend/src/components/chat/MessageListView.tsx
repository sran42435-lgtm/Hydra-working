import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { chatStore, Message } from "../../store/chat_state_store";
import { HydraIcon } from "../ui/HydraIcon";
import { ThinkingBubble } from "./ThinkingBubble";

interface MessageListViewProps {
  isLoading: boolean;
  onEditMessage?: (text: string, messageId: string) => void;
  onRetryMessage?: (text: string) => void;
  editingMessageId?: string | null;
}

const ScrollDownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

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

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const RetryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

// ---------- Slow-drag hook ----------
function useSlowDrag(initialX: number, initialY: number) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const targetRef = useRef({ x: initialX, y: initialY });
  const rafRef = useRef<number | null>(null);

  const updatePosition = useCallback(() => {
    setPos((prev) => {
      const dx = targetRef.current.x - prev.x;
      const dy = targetRef.current.y - prev.y;
      const newX = prev.x + dx * 0.4;
      const newY = prev.y + dy * 0.4;
      return { x: newX, y: newY };
    });
    rafRef.current = requestAnimationFrame(updatePosition);
  }, []);

  const startDrag = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updatePosition);
  }, [updatePosition]);

  const stopDrag = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const setTarget = useCallback((x: number, y: number) => {
    targetRef.current = { x, y };
  }, []);

  const reset = useCallback((x: number, y: number) => {
    targetRef.current = { x, y };
    setPos({ x, y });
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { pos, startDrag, stopDrag, setTarget, reset };
}

// --------------------------------

export const MessageListView: React.FC<MessageListViewProps> = ({
  isLoading,
  onEditMessage,
  onRetryMessage,
  editingMessageId,
}) => {
  const [messages, setMessages] = useState<Message[]>(chatStore.getState().messages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionBoardId, setActionBoardId] = useState<string | null>(null);
  const [spinningRetryId, setSpinningRetryId] = useState<string | null>(null);

  const { pos: boardPos, startDrag, stopDrag, setTarget, reset: resetBoard } = useSlowDrag(0, 0);
  const [isDraggingBoard, setIsDraggingBoard] = useState(false);

  // Pop-in effect
  const [boardPopScale, setBoardPopScale] = useState(0.85);
  useEffect(() => {
    if (actionBoardId) {
      setBoardPopScale(0.85);
      const timer = setTimeout(() => setBoardPopScale(1), 20);
      return () => clearTimeout(timer);
    }
  }, [actionBoardId]);

  useEffect(() => {
    const unsubscribe = chatStore.subscribe(() =>
      setMessages([...chatStore.getState().messages])
    );
    return () => {
      unsubscribe();
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

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

  const hiddenIds = useMemo(() => {
    if (!editingMessageId) return new Set<string>();
    const idx = mergedMessages.findIndex((m) => m.id === editingMessageId);
    if (idx === -1) return new Set<string>();
    return new Set(mergedMessages.slice(idx).map((m) => m.id));
  }, [mergedMessages, editingMessageId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mergedMessages]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const threshold = 50;
    const atBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    setIsAtBottom(atBottom);
    setIsScrolling(true);
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => setIsScrolling(false), 0);
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

  useEffect(() => {
    if (isScrolling) setActionBoardId(null);
  }, [isScrolling]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
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
    setActionBoardId(null);
  };

  const handleEdit = (text: string, id: string) => {
    onEditMessage?.(text, id);
    setActionBoardId(null);
  };

  const handleRetry = (text: string, msgId: string) => {
    setSpinningRetryId(msgId);
    setTimeout(() => {
      setSpinningRetryId(null);
      onRetryMessage?.(text);
    }, 600);
  };

  // Single tap opens the board
  const openBoard = (msgId: string, clientX: number, clientY: number) => {
    if (actionBoardId === msgId) {
      // Toggle off if already open
      setActionBoardId(null);
      return;
    }
    resetBoard(clientX, clientY + 70);
    setTarget(clientX, clientY + 70);
    setActionBoardId(msgId);
  };

  const showScrollButton = !isAtBottom && !isScrolling;

  const lastAssistantMessageId = useMemo(() => {
    for (let i = mergedMessages.length - 1; i >= 0; i--) {
      if (mergedMessages[i].role === "assistant" && !mergedMessages[i].id.endsWith("_stopped")) {
        return mergedMessages[i].id;
      }
    }
    return null;
  }, [mergedMessages]);

  const boardActiveScale = boardPopScale !== 1 ? boardPopScale : (isDraggingBoard ? 0.95 : 1);

  return (
    <div
      ref={scrollContainerRef}
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "60px 16px 110px",
        backgroundColor: "#fafafa",
        position: "relative",
        overscrollBehavior: "contain",
      }}
      onClick={() => setActionBoardId(null)}
      onTouchMove={(e) => {
        if (isDraggingBoard) e.preventDefault();
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
        @keyframes spinOnce {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
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

      {mergedMessages.map((msg, idx) => {
        if (hiddenIds.has(msg.id)) return null;

        const isStoppedMessage = msg.id.endsWith("_stopped");
        const nextMsg = mergedMessages[idx + 1];
        const isFollowedByStop = nextMsg?.id.endsWith("_stopped") ?? false;

        if (isStoppedMessage) {
          return (
            <div key={msg.id} style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 12,
              paddingRight: 4,
            }}>
              <span style={{
                color: "#EF4444",
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

              {cleanContent && !isStreamingThis && (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <div style={{
                    width: "100%",
                    height: 1,
                    marginTop: 8,
                    backgroundColor: "rgba(0,0,0,0.05)",
                    transformOrigin: "left center",
                    animation: "drawLine 0.4s ease forwards",
                  }} />
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

        // ========== USER MESSAGE ==========
        const isActionOpen = actionBoardId === msg.id;
        const isSpinning = spinningRetryId === msg.id;

        return (
          <div key={msg.id} style={{
            width: "100%",
            marginBottom: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            position: "relative",
          }}>
            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 8,
            }}>
              {isFollowedByStop && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRetry(msg.content, msg.id);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "none",
                    backgroundColor: "transparent",
                    color: "#EF4444",
                    cursor: "pointer",
                    flexShrink: 0,
                    animation: isSpinning ? "spinOnce 0.6s ease-in-out" : "none",
                  }}
                >
                  <RetryIcon />
                </button>
              )}

              <div
                onClick={(e) => {
                  e.stopPropagation();
                  openBoard(msg.id, e.clientX, e.clientY);
                }}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  maxWidth: "75%",
                  minWidth: 0,
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
                  cursor: "pointer",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  touchAction: "manipulation",
                }}
              >
                {msg.content}
              </div>
            </div>

            {/* Action board */}
            {isActionOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "fixed",
                  left: boardPos.x,
                  top: boardPos.y,
                  transform: `translate(-50%, -50%) scale(${boardActiveScale})`,
                  transition: "transform 0.15s ease",
                  minWidth: 180,
                  backgroundColor: "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  borderRadius: 14,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  border: "1px solid rgba(0,0,0,0.04)",
                  padding: "0 0 4px 0",
                  zIndex: 20,
                  cursor: "default",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  touchAction: "none",
                }}
              >
                {/* Drag handle – single pill, large touch area */}
                <div
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    const touch = e.touches[0];
                    setTarget(touch.clientX, touch.clientY);
                    startDrag();
                    setIsDraggingBoard(true);
                  }}
                  onTouchMove={(e) => {
                    if (!isDraggingBoard) return;
                    const touch = e.touches[0];
                    setTarget(touch.clientX, touch.clientY);
                  }}
                  onTouchEnd={() => {
                    stopDrag();
                    setIsDraggingBoard(false);
                  }}
                  onTouchCancel={() => {
                    stopDrag();
                    setIsDraggingBoard(false);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setTarget(e.clientX, e.clientY);
                    startDrag();
                    setIsDraggingBoard(true);
                  }}
                  onMouseMove={(e) => {
                    if (!isDraggingBoard) return;
                    setTarget(e.clientX, e.clientY);
                  }}
                  onMouseUp={() => {
                    stopDrag();
                    setIsDraggingBoard(false);
                  }}
                  onMouseLeave={() => {
                    stopDrag();
                    setIsDraggingBoard(false);
                  }}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "12px 0 8px 0",
                    cursor: isDraggingBoard ? "grabbing" : "grab",
                    borderTopLeftRadius: 14,
                    borderTopRightRadius: 14,
                    userSelect: "none",
                    WebkitUserSelect: "none",
                  }}
                >
                  <div style={{
                    width: 40,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: "rgba(0,0,0,0.2)",
                  }} />
                </div>

                {/* Copy button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(msg.content, msg.id);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    border: "none",
                    backgroundColor: "transparent",
                    color: "#1a1a1a",
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background-color 0.1s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <span>Copy message</span>
                  <ClipboardIcon />
                </button>

                <div style={{ height: 1, backgroundColor: "rgba(0,0,0,0.05)", margin: "2px 0" }} />

                {/* Edit button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(msg.content, msg.id);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    border: "none",
                    backgroundColor: "transparent",
                    color: "#1a1a1a",
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background-color 0.1s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <span>Edit</span>
                  <PencilLineIcon />
                </button>
              </div>
            )}
          </div>
        );
      })}

      <ThinkingBubble isLoading={isLoading} />
      <div ref={bottomRef} />

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
