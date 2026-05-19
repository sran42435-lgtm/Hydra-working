// frontend/src/components/chat/MessageListView.tsx

import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
  useDeferredValue,
} from "react";
import { chatStore, Message } from "../../store/chat_state_store";
import { HydraIcon } from "../ui/HydraIcon";
import { ThinkingBubble } from "./ThinkingBubble";
import { AIMessageSheet } from "./AIMessageSheet";
import { MessageBubbleView } from "./MessageBubbleView";
import { useAutoScroll } from "../../hooks/useAutoScroll";
import { useShare } from "../../hooks/useShare";
import { ShareSheet } from "./ShareSheet";
import { ActionBoard } from "./ActionBoard";

interface MessageListViewProps {
  isLoading: boolean;
  isDesktop?: boolean;
  extraBottomPadding?: number;
  sidebarWidth?: number;
  onEditMessage?: (text: string, messageId: string) => void;
  onRetryMessage?: (text: string, messageId: string) => void;
  onRegenerateMessage?: (userText: string, aiMessageId: string) => void;
  editingMessageId?: string | null;
}

const ScrollDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
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
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const RetryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const ScrollTextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 12h-5" />
    <path d="M15 8h-5" />
    <path d="M19 17V5a2 2 0 0 0-2-2H4" />
    <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />
  </svg>
);

const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/>
    <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
  </svg>
);

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
      const boardW = 200;
      const boardH = 150;
      const maxX = window.innerWidth - boardW / 2;
      const maxY = window.innerHeight - boardH / 2;
      const minX = boardW / 2;
      const minY = boardH / 2;
      return {
        x: Math.min(maxX, Math.max(minX, newX)),
        y: Math.min(maxY, Math.max(minY, newY)),
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

export const MessageListView: React.FC<MessageListViewProps> = ({
  isLoading,
  isDesktop = false,
  extraBottomPadding = 0,
  sidebarWidth,
  onEditMessage,
  onRetryMessage,
  onRegenerateMessage,
  editingMessageId,
}) => {
  const [streamingAiId, setStreamingAiId] = useState<string | null>(
    chatStore.getState().streamingAiId
  );
  const [messages, setMessages] = useState<Message[]>(chatStore.getState().messages);
  const deferredMessages = useDeferredValue(messages);

  const {
    containerRef: scrollContainerRef,
    bottomRef,
    isAtBottom,
    isScrolling,
    scrollToBottom,
  } = useAutoScroll({
    isLoading,
    dependency: deferredMessages.length,
    nearBottomThreshold: 50,
    scrollEndDelay: 150,
  });

  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shrinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef<boolean>(false);
  const longPressTargetRef = useRef<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionBoardId, setActionBoardId] = useState<string | null>(null);
  const [spinningRetryId, setSpinningRetryId] = useState<string | null>(null);
  const [spinningRegenerateId, setSpinningRegenerateId] = useState<string | null>(null);

  const [selectedAiContent, setSelectedAiContent] = useState<string>("");
  const [pressedAiId, setPressedAiId] = useState<string | null>(null);
  const [pressedUserId, setPressedUserId] = useState<string | null>(null);

  // ---- SHARE STATE & HOOK ----
  const [shareTarget, setShareTarget] = useState<{ content: string; userPrompt?: string } | null>(null);
  const { shareExternally, copyShareText, exportMarkdown } = useShare();

  const { pos: boardPos, startDrag, stopDrag, setTarget, reset: resetBoard } = useSlowDrag(0, 0);
  const [isDraggingBoard, setIsDraggingBoard] = useState(false);
  const [isBoardPressed, setIsBoardPressed] = useState(false);
  const [hasBoardAppeared, setHasBoardAppeared] = useState(false);

  useEffect(() => {
    const handler = () => setActionBoardId(null);
    document.addEventListener("closeActionBoard", handler);
    return () => document.removeEventListener("closeActionBoard", handler);
  }, []);

  useEffect(() => {
    const unsubscribe = chatStore.subscribe(() => {
      setMessages([...chatStore.getState().messages]);
      setStreamingAiId(chatStore.getState().streamingAiId);
    });
    return () => {
      unsubscribe();
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const mergedMessages = useMemo(() => {
    const result: Message[] = [];
    for (let i = 0; i < deferredMessages.length; i++) {
      const current = deferredMessages[i];
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
  }, [deferredMessages]);

  const hiddenIds = useMemo(() => {
    if (!editingMessageId) return new Set<string>();
    const idx = mergedMessages.findIndex((m) => m.id === editingMessageId);
    if (idx === -1) return new Set<string>();
    return new Set(mergedMessages.slice(idx).map((m) => m.id));
  }, [mergedMessages, editingMessageId]);

  const chunkCache = useMemo(() => {
    const cache: Record<string, { chunks: string[] }> = {};
    mergedMessages.forEach((msg) => {
      if (msg.role === "assistant") {
        const cleanContent = msg.content.replace(/[\r\n]+/g, " ").trim();
        const words = cleanContent.split(" ");
        const chunks: string[] = [];
        for (let i = 0; i < words.length; i += 4) {
          chunks.push(words.slice(i, i + 4).join(" "));
        }
        cache[msg.id] = { chunks };
      }
    });
    return cache;
  }, [mergedMessages]);

  const prevChunkCountRef = useRef<Record<string, number>>({});
  useEffect(() => {
    mergedMessages.forEach((msg) => {
      if (msg.role === "assistant") {
        const cleanContent = msg.content.replace(/[\r\n]+/g, " ").trim();
        const words = cleanContent.split(" ");
        prevChunkCountRef.current[msg.id] = Math.ceil(words.length / 4);
      }
    });
  }, [mergedMessages]);

  useEffect(() => {
    if (isScrolling) setActionBoardId(null);
  }, [isScrolling]);

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
    onRetryMessage?.(text, msgId);
    setActionBoardId(null);
  };

  const handleRetryWithSpin = (text: string, msgId: string) => {
    setSpinningRetryId(msgId);
    setTimeout(() => {
      setSpinningRetryId(null);
      onRetryMessage?.(text, msgId);
    }, 600);
  };

  const handleRegenerate = (userText: string, aiMsgId: string) => {
    setSpinningRegenerateId(aiMsgId);
    setTimeout(() => {
      setSpinningRegenerateId(null);
      onRegenerateMessage?.(userText, aiMsgId);
    }, 600);
  };

  const handleOpenSheet = useCallback((content: string) => {
    setSelectedAiContent(content);
  }, []);

  const handleOpenShare = useCallback((content: string, userPrompt: string | undefined) => {
    setShareTarget({ content, userPrompt });
  }, []);

  const handleCloseShare = useCallback(() => {
    setShareTarget(null);
  }, []);

  const openBoard = (msgId: string, clientX: number, clientY: number) => {
    if (actionBoardId === msgId) {
      setActionBoardId(null);
      return;
    }
    resetBoard(clientX, clientY + 70);
    setTarget(clientX, clientY + 70);
    setActionBoardId(msgId);
    setHasBoardAppeared(false);
  };

  const startAiLongPress = useCallback((msgId: string, content: string) => {
    longPressTargetRef.current = msgId;
    longPressFiredRef.current = false;
    if (shrinkTimerRef.current) clearTimeout(shrinkTimerRef.current);
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    shrinkTimerRef.current = setTimeout(() => {
      if (longPressTargetRef.current === msgId && !longPressFiredRef.current) {
        setPressedAiId(msgId);
      }
    }, 200);
    longPressTimerRef.current = setTimeout(() => {
      if (shrinkTimerRef.current) clearTimeout(shrinkTimerRef.current);
      if (longPressTargetRef.current === msgId) {
        longPressFiredRef.current = true;
        setPressedAiId(null);
        setSelectedAiContent(content);
      }
    }, 500);
  }, []);

  const endAiLongPress = useCallback(() => {
    if (shrinkTimerRef.current) {
      clearTimeout(shrinkTimerRef.current);
      shrinkTimerRef.current = null;
    }
    if (!longPressFiredRef.current) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      setPressedAiId(null);
    }
    longPressTargetRef.current = null;
  }, []);

  const showScrollButton = !isAtBottom && !isScrolling;

  const boardActiveScale = isBoardPressed ? 0.92 : isDraggingBoard ? 0.95 : 1;

  const boardAnimation = (() => {
    if (hasBoardAppeared) return "none";
    if (isDraggingBoard || isBoardPressed) return "none";
    return "liquidGlassPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards";
  })();

  useEffect(() => {
    if (!actionBoardId) return;
    const timer = setTimeout(() => setHasBoardAppeared(true), 600);
    return () => clearTimeout(timer);
  }, [actionBoardId]);

  useEffect(() => {
    if (isDraggingBoard || isBoardPressed) setHasBoardAppeared(true);
  }, [isDraggingBoard, isBoardPressed]);

  const chatFont = "'Literata', serif";
  const chatFontWeight = 700;
  const chatFontSize = 24;
  const chatLineHeight = 1.45;
  const chatLetterSpacing = "-0.02em";
  const chatBg = "#fdf6f0";

  const SCROLL_BUTTON_STYLE: React.CSSProperties = {
    position: "sticky",
    bottom: 16,
    left: "50%",
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "1px solid rgba(0,0,0,0.04)",
    backgroundColor: "#fdf6f0",
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
  };

  const HANDLE_STYLE: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "12px 0 8px 0",
    cursor: "grab",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    userSelect: "none",
    WebkitUserSelect: "none",
  };

  const HANDLE_PILL_STYLE: React.CSSProperties = {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(120, 113, 108, 0.42)",
  };

  const userLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userLongPressFiredRef = useRef<boolean>(false);

  const startUserLongPress = useCallback((msgId: string) => {
    if (userLongPressTimerRef.current) clearTimeout(userLongPressTimerRef.current);
    userLongPressFiredRef.current = false;
    userLongPressTimerRef.current = setTimeout(() => {
      userLongPressFiredRef.current = true;
      setPressedUserId(msgId);
    }, 500);
  }, []);

  const endUserLongPress = useCallback((msg: Message) => {
    if (userLongPressTimerRef.current) clearTimeout(userLongPressTimerRef.current);
    if (userLongPressFiredRef.current) {
      setPressedUserId(null);
      handleOpenSheet(msg.content);
    }
  }, [handleOpenSheet]);

  const cancelUserLongPress = useCallback(() => {
    if (userLongPressTimerRef.current) clearTimeout(userLongPressTimerRef.current);
    setPressedUserId(null);
  }, []);

  const handleUserClick = useCallback((msg: Message, clientX: number, clientY: number) => {
    if (userLongPressFiredRef.current) return;
    openBoard(msg.id, clientX, clientY);
  }, [openBoard]);

  return (
    <div
      ref={scrollContainerRef}
      style={{
        flex: 1,
        overflowY: "auto",
        scrollbarGutter: "stable",
        padding: `60px 16px ${110 + extraBottomPadding}px`,
        backgroundColor: chatBg,
        position: "relative",
        overscrollBehavior: "contain",
      }}
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
        @keyframes liquidGlassPop {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
          }
          60% {
            transform: translate(-50%, -50%) scale(1.05);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
          }
        }
        @keyframes fadeInChunk {
          0% { opacity: 0; transform: translateY(3px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes blinkCursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      {actionBoardId && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setActionBoardId(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 19,
            backgroundColor: "transparent",
          }}
        />
      )}

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
          <p style={{
            marginTop: 12,
            color: "#1a1a1a",
            fontFamily: chatFont,
            fontSize: chatFontSize,
            fontWeight: chatFontWeight,
            lineHeight: chatLineHeight,
            letterSpacing: chatLetterSpacing,
          }}>
            Kirim pesan untuk memulai
          </p>
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
                fontFamily: chatFont,
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
          const isStreamingThis = msg.id === streamingAiId;
          const isSpinningRegen = spinningRegenerateId === msg.id;
          const isPressed = pressedAiId === msg.id;
          const prevMsg = mergedMessages[idx - 1];
          const userText = prevMsg?.role === "user" ? prevMsg.content : "";

          const cached = chunkCache[msg.id] || { chunks: [] };
          const { chunks } = cached;
          const prevChunkCount = prevChunkCountRef.current[msg.id] || 0;

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
                onTouchStart={(e) => {
                  if (isStreamingThis) return;
                  e.stopPropagation();
                  startAiLongPress(msg.id, cleanContent);
                }}
                onTouchEnd={endAiLongPress}
                onTouchMove={endAiLongPress}
                onTouchCancel={endAiLongPress}
                onMouseDown={(e) => {
                  if (isStreamingThis) return;
                  e.stopPropagation();
                  startAiLongPress(msg.id, cleanContent);
                }}
                onMouseUp={endAiLongPress}
                onMouseLeave={endAiLongPress}
                style={{
                  width: "100%",
                  padding: "8px 0 0 0",
                  color: "#1a1a1a",
                  fontFamily: chatFont,
                  fontSize: chatFontSize,
                  fontWeight: chatFontWeight,
                  lineHeight: chatLineHeight,
                  letterSpacing: chatLetterSpacing,
                  whiteSpace: "normal",
                  overflowWrap: "break-word",
                  cursor: isStreamingThis ? "default" : "pointer",
                  transform: isPressed ? "scale(0.97)" : "scale(1)",
                  transition: "transform 0.15s ease",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                }}
              >
                {chunks.map((chunk, i) => (
                  <span
                    key={i}
                    style={{
                      animation:
                        i >= prevChunkCount && !isScrolling
                          ? "fadeInChunk 0.25s ease forwards"
                          : "none",
                      display: "inline",
                    }}
                  >
                    {chunk}{" "}
                  </span>
                ))}
                {isStreamingThis && (
                  <span style={{
                    display: "inline-block",
                    width: 2,
                    height: "0.9em",
                    backgroundColor: "#1a1a1a",
                    marginLeft: 2,
                    verticalAlign: "text-bottom",
                    animation: "blinkCursor 0.7s step-end infinite",
                  }} />
                )}
              </div>

              {cleanContent && !isStreamingThis && (
                <div style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}>
                  <div style={{
                    width: "100%",
                    height: 1,
                    marginTop: 8,
                    backgroundColor: "rgba(0,0,0,0.05)",
                    transformOrigin: "left center",
                    animation: "drawLine 0.4s ease forwards",
                  }} />
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    marginTop: 4,
                  }}>
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
                        padding: 8,
                        border: "none",
                        borderRadius: 6,
                        backgroundColor: "transparent",
                        color: isCopied ? "#4CAF50" : "#999",
                        cursor: "pointer",
                        transition: "color 0.15s ease",
                      }}
                      aria-label="Salin pesan"
                    >
                      {isCopied ? <CheckIcon /> : <ClipboardIcon />}
                    </button>
                    {userText && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegenerate(userText, msg.id);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 8,
                          border: "none",
                          borderRadius: 6,
                          backgroundColor: "transparent",
                          color: "#999",
                          cursor: "pointer",
                          transition: "color 0.15s ease",
                          animation: isSpinningRegen
                            ? "spinOnce 0.6s ease-in-out"
                            : "none",
                        }}
                        aria-label="Kirim ulang"
                      >
                        <RetryIcon />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenSheet(cleanContent);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 8,
                        border: "none",
                        borderRadius: 6,
                        backgroundColor: "transparent",
                        color: "#999",
                        cursor: "pointer",
                        transition: "color 0.15s ease",
                      }}
                      aria-label="Buka teks"
                    >
                      <ScrollTextIcon />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const userPrompt = prevMsg?.role === 'user' ? prevMsg.content : undefined;
                        handleOpenShare(cleanContent, userPrompt);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 8,
                        border: "none",
                        borderRadius: 6,
                        backgroundColor: "transparent",
                        color: "#999",
                        cursor: "pointer",
                        transition: "color 0.15s ease",
                      }}
                      aria-label="Bagikan"
                    >
                      <ShareIcon />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        }

        // ========== USER MESSAGE ==========
        const isActionOpen = actionBoardId === msg.id;
        const isSpinning = spinningRetryId === msg.id;
        const isUserPressed = pressedUserId === msg.id;

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
            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 8,
              width: "100%",
            }}>
              {isFollowedByStop && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRetryWithSpin(msg.content, msg.id);
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
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  startUserLongPress(msg.id);
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  endUserLongPress(msg);
                }}
                onTouchMove={cancelUserLongPress}
                onTouchCancel={cancelUserLongPress}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  startUserLongPress(msg.id);
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  endUserLongPress(msg);
                }}
                onMouseLeave={cancelUserLongPress}
                onClick={(e) => {
                  handleUserClick(msg, e.clientX, e.clientY);
                }}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  maxWidth: "75%",
                  cursor: "pointer",
                  flexShrink: 0,
                  transform: isUserPressed ? "scale(0.93)" : "scale(1)",
                  transition: "transform 0.15s ease",
                }}
              >
                <MessageBubbleView content={msg.content} isUser />
              </div>
            </div>

            {/* =============== PAPAN AKSI =============== */}
            {isActionOpen && (
              <ActionBoard
                x={boardPos.x}
                y={boardPos.y}
                content={msg.content}
                messageId={msg.id}
                boardActiveScale={boardActiveScale}
                boardAnimation={boardAnimation}
                isDraggingBoard={isDraggingBoard}
                isBoardPressed={isBoardPressed}
                handleStyle={HANDLE_STYLE}
                handlePillStyle={HANDLE_PILL_STYLE}
                onDragStart={(e) => {
                  const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
                  const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
                  setTarget(clientX, clientY);
                  startDrag();
                  setIsDraggingBoard(true);
                }}
                onDragMove={(e) => {
                  if (!isDraggingBoard) return;
                  const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
                  const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
                  setTarget(clientX, clientY);
                }}
                onDragEnd={() => {
                  stopDrag();
                  setIsDraggingBoard(false);
                }}
                onCopy={handleCopy}
                onEdit={handleEdit}
                onRetry={handleRetry}
              />
            )}
          </div>
        );
      })}

      <ThinkingBubble isLoading={isLoading} />
      <div ref={bottomRef} />

      {showScrollButton && (
        <button onClick={scrollToBottom} style={SCROLL_BUTTON_STYLE}>
          <ScrollDownIcon />
        </button>
      )}

      {selectedAiContent && (
        <AIMessageSheet
          content={selectedAiContent}
          onClose={() => setSelectedAiContent("")}
          isDesktop={isDesktop}
          sidebarWidth={sidebarWidth ?? (isDesktop ? 260 : 0)}
        />
      )}

      {shareTarget && (
        <ShareSheet
          content={shareTarget.content}
          userPrompt={shareTarget.userPrompt}
          onClose={handleCloseShare}
          onShareExternal={() => shareExternally(shareTarget.content, shareTarget.userPrompt)}
          onCopyText={() => copyShareText(shareTarget.content, shareTarget.userPrompt)}
          onExportMarkdown={() => exportMarkdown(shareTarget.content, shareTarget.userPrompt)}
        />
      )}
    </div>
  );
};

export default MessageListView;
