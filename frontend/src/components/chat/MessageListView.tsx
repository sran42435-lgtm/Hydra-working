import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { chatStore, Message } from "../../store/chat_state_store";
import { HydraIcon } from "../ui/HydraIcon";
import { ThinkingBubble } from "./ThinkingBubble";

/* ---------- props ---------- */
interface MessageListViewProps {
  isLoading: boolean;
  onEditMessage?: (text: string, messageId: string) => void;
  onRetryMessage?: (text: string) => void;
  editingMessageId?: string | null;
}

/* ---------- icons ---------- */
const ScrollDownIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ClipboardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </svg>
);

const PencilLineIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M13 21h8" />
    <path d="m15 5 4 4" />
    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
  </svg>
);

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const RetryIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

/* ---------- constants ---------- */
const LONG_PRESS_MS = 500;

/* ---------- slow‑drag hook ---------- */
function useSlowDrag(initialX: number, initialY: number) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const targetRef = useRef({ x: initialX, y: initialY });
  const rafRef = useRef<number | null>(null);

  const updatePosition = useCallback(() => {
    setPos((prev) => {
      const dx = targetRef.current.x - prev.x;
      const dy = targetRef.current.y - prev.y;
      return {
        x: prev.x + dx * 0.4,
        y: prev.y + dy * 0.4,
      };
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

/* ========== component ========== */
export const MessageListView: React.FC<MessageListViewProps> = ({
  isLoading,
  onEditMessage,
  onRetryMessage,
  editingMessageId,
}) => {
  /* ---- state ---- */
  const [messages, setMessages] = useState<Message[]>(chatStore.getState().messages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef<boolean>(false);
  const longPressTargetRef = useRef<string | null>(null);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionBoardId, setActionBoardId] = useState<string | null>(null);
  const [spinningRetryId, setSpinningRetryId] = useState<string | null>(null);

  const { pos: boardPos, startDrag, stopDrag, setTarget, reset: resetBoard } =
    useSlowDrag(0, 0);
  const [isDraggingBoard, setIsDraggingBoard] = useState(false);

  /* pop‑in scale */
  const [boardPopScale, setBoardPopScale] = useState(0.85);
  useEffect(() => {
    if (actionBoardId) {
      setBoardPopScale(0.85);
      const timer = setTimeout(() => setBoardPopScale(1), 20);
      return () => clearTimeout(timer);
    }
  }, [actionBoardId]);

  /* ---- subscribe store ---- */
  useEffect(() => {
    const unsub = chatStore.subscribe(() =>
      setMessages([...chatStore.getState().messages])
    );
    return () => {
      unsub();
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  /* ---- merge assistant messages ---- */
  const mergedMessages = useMemo(() => {
    const result: Message[] = [];
    for (const m of messages) {
      if (m.id.endsWith("_stopped")) {
        result.push(m);
        continue;
      }
      if (m.role === "assistant") {
        const prev = result[result.length - 1];
        if (prev && prev.role === "assistant" && !prev.id.endsWith("_stopped")) {
          prev.content += " " + m.content;
          prev.id = m.id;
          continue;
        }
      }
      result.push({ ...m });
    }
    return result;
  }, [messages]);

  /* ---- hidden during edit ---- */
  const hiddenIds = useMemo(() => {
    if (!editingMessageId) return new Set<string>();
    const idx = mergedMessages.findIndex((m) => m.id === editingMessageId);
    if (idx === -1) return new Set<string>();
    return new Set(mergedMessages.slice(idx).map((m) => m.id));
  }, [mergedMessages, editingMessageId]);

  /* ---- auto scroll ---- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mergedMessages]);

  /* ---- scroll detection ---- */
  const handleScroll = useCallback(() => {
    const c = scrollContainerRef.current;
    if (!c) return;
    const atBottom =
      c.scrollHeight - c.scrollTop - c.clientHeight < 50;
    setIsAtBottom(atBottom);
    setIsScrolling(true);
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => setIsScrolling(false), 0);
  }, []);

  useEffect(() => {
    const c = scrollContainerRef.current;
    if (!c) return;
    c.addEventListener("scroll", handleScroll, { passive: true });
    return () => c.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (isScrolling) setActionBoardId(null);
  }, [isScrolling]);

  /* ---- clipboard ---- */
  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
      }
    } catch (_) {
      /* fallback */
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
    } catch (_) {
      /* ignore */
    }
    document.body.removeChild(ta);
  };

  /* ---- actions ---- */
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCopy = async (content: string, id: string) => {
    await copyToClipboard(content);
    setCopiedId(id);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
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

  /* ---- long press ---- */
  const startLongPress = (msgId: string, cx: number, cy: number) => {
    longPressTargetRef.current = msgId;
    longPressFiredRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      if (longPressTargetRef.current === msgId) {
        longPressFiredRef.current = true;
        resetBoard(cx, cy);
        setTarget(cx, cy);
        startDrag();
        setIsDraggingBoard(true);
        setActionBoardId(msgId);
      }
    }, LONG_PRESS_MS);
  };

  const endLongPress = () => {
    if (!longPressFiredRef.current) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    } else {
      stopDrag();
      setIsDraggingBoard(false);
    }
    longPressTargetRef.current = null;
  };

  /* ---- derived ---- */
  const showScrollButton = !isAtBottom && !isScrolling;

  const lastAssistantId = useMemo(() => {
    for (let i = mergedMessages.length - 1; i >= 0; i--) {
      const m = mergedMessages[i];
      if (m.role === "assistant" && !m.id.endsWith("_stopped")) return m.id;
    }
    return null;
  }, [mergedMessages]);

  const boardActiveScale =
    boardPopScale !== 1 ? boardPopScale : isDraggingBoard ? 0.95 : 1;

  /* ========== render ========== */
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
        @keyframes scaleIn{0%{transform:translateX(-50%) scale(0);opacity:0;}100%{transform:translateX(-50%) scale(1);opacity:1;}}
        @keyframes drawLine{0%{transform:scaleX(0);}100%{transform:scaleX(1);}}
        @keyframes spinOnce{0%{transform:rotate(0deg);}100%{transform:rotate(-360deg);}}
      `}</style>

      {/* empty state */}
      {mergedMessages.length === 0 && !isLoading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "#1a1a1a",
            textAlign: "center",
          }}
        >
          <HydraIcon size={48} />
          <p style={{ marginTop: 12, color: "#1a1a1a" }}>Kirim pesan untuk memulai</p>
        </div>
      )}

      {mergedMessages.map((msg, idx) => {
        if (hiddenIds.has(msg.id)) return null;

        const isStopped = msg.id.endsWith("_stopped");
        const nextMsg = mergedMessages[idx + 1];
        const followedByStop = nextMsg?.id.endsWith("_stopped") ?? false;

        /* ---- stop warning ---- */
        if (isStopped) {
          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 12,
                paddingRight: 4,
              }}
            >
              <span
                style={{
                  color: "#EF4444",
                  fontStyle: "italic",
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {msg.content}
              </span>
            </div>
          );
        }

        /* ---- assistant message ---- */
        if (msg.role === "assistant") {
          const cleanContent = msg.content.replace(/[\r\n]+/g, " ").trim();
          const copied = copiedId === msg.id;
          const streamingThis = isLoading && msg.id === lastAssistantId;

          return (
            <div
              key={msg.id}
              style={{
                marginBottom: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: "100%",
                  padding: "8px 0 0 0",
                  color: "#1a1a1a",
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 18,
                  fontWeight: 900,
                  lineHeight: 1.5,
                  whiteSpace: "normal",
                  overflowWrap: "break-word",
                }}
              >
                {cleanContent}
              </div>

              {cleanContent && !streamingThis && (
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: 1,
                      marginTop: 8,
                      backgroundColor: "rgba(0,0,0,0.05)",
                      transformOrigin: "left center",
                      animation: "drawLine 0.4s ease forwards",
                    }}
                  />
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
                      color: copied ? "#4CAF50" : "#999",
                      cursor: "pointer",
                      transition: "color 0.15s ease",
                      fontSize: 16,
                      lineHeight: 1,
                    }}
                    aria-label="Salin pesan"
                  >
                    {copied ? <CheckIcon /> : <ClipboardIcon />}
                  </button>
                </div>
              )}
            </div>
          );
        }

        /* ---- user message ---- */
        const actionOpen = actionBoardId === msg.id;

        return (
          <div
            key={msg.id}
            style={{
              width: "100%",
              marginBottom: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 8,
              }}
            >
              {followedByStop && (
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
                    animation: spinningRetryId === msg.id
                      ? "spinOnce 0.6s ease-in-out"
                      : "none",
                  }}
                >
                  <RetryIcon />
                </button>
              )}

              {/* bubble */}
              <div
                onTouchStart={(e) => {
                  e.stopPropagation();
                  const t = e.touches[0];
                  startLongPress(msg.id, t.clientX, t.clientY);
                }}
                onTouchEnd={endLongPress}
                onTouchMove={(e) => {
                  if (longPressFiredRef.current) {
                    const t = e.touches[0];
                    setTarget(t.clientX, t.clientY);
                    if (!isDraggingBoard) {
                      startDrag();
                      setIsDraggingBoard(true);
                    }
                  }
                }}
                onTouchCancel={endLongPress}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  startLongPress(msg.id, e.clientX, e.clientY);
                }}
                onMouseUp={endLongPress}
                onMouseMove={(e) => {
                  if (longPressFiredRef.current) {
                    setTarget(e.clientX, e.clientY);
                    if (!isDraggingBoard) {
                      startDrag();
                      setIsDraggingBoard(true);
                    }
                  }
                }}
                onMouseLeave={() => {
                  if (longPressFiredRef.current) {
                    stopDrag();
                    setIsDraggingBoard(false);
                  }
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

            {/* action board */}
            {actionOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  const t = e.touches[0];
                  setTarget(t.clientX, t.clientY);
                  startDrag();
                  setIsDraggingBoard(true);
                }}
                onTouchMove={(e) => {
                  if (!isDraggingBoard) return;
                  const t = e.touches[0];
                  setTarget(t.clientX, t.clientY);
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
                  padding: "4px 0",
                  zIndex: 20,
                  cursor: isDraggingBoard ? "grabbing" : "grab",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  touchAction: "none",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleCopy(msg.content, msg.id)}
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
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.03)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <span>Copy message</span>
                  <ClipboardIcon />
                </button>

                <div
                  style={{
                    height: 1,
                    backgroundColor: "rgba(0,0,0,0.05)",
                    margin: "2px 0",
                  }}
                />

                <button
                  type="button"
                  onClick={() => handleEdit(msg.content, msg.id)}
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
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.03)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
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
