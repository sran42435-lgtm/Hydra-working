import React, { useRef, useState, useEffect, useCallback } from "react";
import { chatStore } from "../../store/chat_state_store";
import { useChatStore } from "./useChatStore";
import { ChatInputBar } from "./ChatInputBar";
import { MessageListView } from "./MessageListView";
import { useStreamResponse } from "../../hooks/useStreamResponse";

interface ChatSessionContainerProps {
  isDesktop?: boolean;
}

export const ChatSessionContainer: React.FC<ChatSessionContainerProps> = ({
  isDesktop = false,
}) => {
  const abortControllerRef = useRef<AbortController | null>(null);

  const { isLoading, currentInput } = useChatStore();

  const { startStream, stopStream } = useStreamResponse();

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  /**
   * keyboard benar-benar terbuka
   */
  const keyboardOpenRef = useRef(false);

  /**
   * lock tinggi keyboard ASLI
   * bukan adjusted height
   */
  const lockedRawKeyboardHeightRef = useRef(0);

  /**
   * timeout close keyboard
   */
  const keyboardCloseTimeoutRef = useRef<number | null>(null);

  /**
   * lock saat mengetik
   */
  const typingLockRef = useRef(false);

  /**
   * unlock typing
   */
  const typingUnlockTimeoutRef = useRef<number | null>(null);

  const lastUserMessageRef = useRef<string>("");

  const editingMessageIdRef = useRef<string | null>(null);

  const streamingAiIdRef = useRef<string | null>(null);

  const aiMessageAddedRef = useRef(false);

  useEffect(() => {
    if (isDesktop || !window.visualViewport) return;

    const viewport = window.visualViewport;

    let frame: number | null = null;

    /**
     * OFFSET INPUT BAR
     *
     * makin besar -> input turun
     * makin kecil -> input naik
     */
    const KEYBOARD_OFFSET = 250;

    const getAdjustedHeight = (rawHeight: number) => {
      return Math.max(rawHeight - KEYBOARD_OFFSET, 0);
    };

    const resetKeyboardState = () => {
      keyboardOpenRef.current = false;

      lockedRawKeyboardHeightRef.current = 0;

      typingLockRef.current = false;

      setKeyboardHeight(0);

      if (keyboardCloseTimeoutRef.current) {
        clearTimeout(keyboardCloseTimeoutRef.current);

        keyboardCloseTimeoutRef.current = null;
      }

      if (typingUnlockTimeoutRef.current) {
        clearTimeout(typingUnlockTimeoutRef.current);

        typingUnlockTimeoutRef.current = null;
      }
    };

    /**
     * lock raw keyboard
     * lalu visualkan adjusted
     */
    const applyKeyboardHeight = (rawHeight: number) => {
      lockedRawKeyboardHeightRef.current = rawHeight;

      setKeyboardHeight(
        getAdjustedHeight(rawHeight)
      );
    };

    /**
     * android spam resize saat mengetik
     */
    const handleTyping = () => {
      typingLockRef.current = true;

      if (typingUnlockTimeoutRef.current) {
        clearTimeout(typingUnlockTimeoutRef.current);
      }

      typingUnlockTimeoutRef.current =
        window.setTimeout(() => {
          typingLockRef.current = false;
        }, 180);
    };

    window.addEventListener("keydown", handleTyping);

    const handleViewportResize = () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }

      frame = requestAnimationFrame(() => {
        /**
         * saat mengetik:
         * jangan update viewport
         */
        if (
          typingLockRef.current &&
          keyboardOpenRef.current
        ) {
          setKeyboardHeight(
            getAdjustedHeight(
              lockedRawKeyboardHeightRef.current
            )
          );

          return;
        }

        const windowHeight = window.innerHeight;

        const viewportHeight = viewport.height;

        const rawKeyboardHeight =
          windowHeight - viewportHeight;

        const keyboardThreshold = 140;

        /**
         * keyboard terbuka
         */
        if (rawKeyboardHeight > keyboardThreshold) {
          keyboardOpenRef.current = true;

          if (keyboardCloseTimeoutRef.current) {
            clearTimeout(keyboardCloseTimeoutRef.current);

            keyboardCloseTimeoutRef.current = null;
          }

          const currentLocked =
            lockedRawKeyboardHeightRef.current;

          const delta = Math.abs(
            rawKeyboardHeight - currentLocked
          );

          /**
           * ignore resize kecil android
           */
          if (delta > 120 || currentLocked === 0) {
            applyKeyboardHeight(
              rawKeyboardHeight
            );
          }

          return;
        }

        /**
         * viewport bounce android
         */
        if (keyboardOpenRef.current) {
          const activeElement = document.activeElement;

          const isTyping =
            activeElement instanceof HTMLTextAreaElement ||
            activeElement instanceof HTMLInputElement;

          /**
           * tahan posisi jika masih fokus
           */
          if (isTyping) {
            setKeyboardHeight(
              getAdjustedHeight(
                lockedRawKeyboardHeightRef.current
              )
            );

            return;
          }

          /**
           * delay close
           */
          if (!keyboardCloseTimeoutRef.current) {
            keyboardCloseTimeoutRef.current =
              window.setTimeout(() => {
                resetKeyboardState();
              }, 220);
          }

          return;
        }

        resetKeyboardState();
      });
    };

    handleViewportResize();

    viewport.addEventListener(
      "resize",
      handleViewportResize
    );

    viewport.addEventListener(
      "scroll",
      handleViewportResize
    );

    /**
     * reset saat app diback/recent apps
     */
    window.addEventListener(
      "pagehide",
      resetKeyboardState
    );

    window.addEventListener(
      "blur",
      resetKeyboardState
    );

    const handleVisibilityChange = () => {
      if (document.hidden) {
        resetKeyboardState();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }

      if (keyboardCloseTimeoutRef.current) {
        clearTimeout(keyboardCloseTimeoutRef.current);
      }

      if (typingUnlockTimeoutRef.current) {
        clearTimeout(typingUnlockTimeoutRef.current);
      }

      window.removeEventListener(
        "keydown",
        handleTyping
      );

      viewport.removeEventListener(
        "resize",
        handleViewportResize
      );

      viewport.removeEventListener(
        "scroll",
        handleViewportResize
      );

      window.removeEventListener(
        "pagehide",
        resetKeyboardState
      );

      window.removeEventListener(
        "blur",
        resetKeyboardState
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [isDesktop]);

  const cleanupStoppedConversations = useCallback(() => {
    const messages = chatStore.getState().messages;

    const cleaned: typeof messages = [];

    for (let i = 0; i < messages.length; i++) {
      const current = messages[i];

      const next = messages[i + 1];

      const isStoppedPair =
        current.role === "user" &&
        next &&
        next.id.endsWith("_stopped");

      if (isStoppedPair) {
        i++;

        continue;
      }

      cleaned.push(current);
    }

    chatStore.setMessages(cleaned);
  }, []);

  const sendToAi = useCallback(
    async (text: string) => {
      chatStore.setLoading(true);

      aiMessageAddedRef.current = false;

      const controller = new AbortController();

      abortControllerRef.current = controller;

      try {
        const res = await fetch("/api/v1/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: text,
          }),
          signal: controller.signal,
        });

        const data = await res.json();

        cleanupStoppedConversations();

        const aiText =
          data.response || "(tidak ada balasan)";

        const aiMessageId =
          Date.now().toString() + "_ai";

        chatStore.addMessage({
          id: aiMessageId,
          role: "assistant",
          content: "",
        });

        aiMessageAddedRef.current = true;

        streamingAiIdRef.current = aiMessageId;

        chatStore.setStreamingAiId(aiMessageId);

        startStream(aiText, aiMessageId, () => {
          streamingAiIdRef.current = null;

          chatStore.setStreamingAiId(null);

          chatStore.setLoading(false);
        });
      } catch (err: unknown) {
        streamingAiIdRef.current = null;

        chatStore.setStreamingAiId(null);

        if (
          err instanceof DOMException &&
          err.name === "AbortError"
        ) {
        } else {
          chatStore.addMessage({
            id: Date.now().toString() + "_err",
            role: "assistant",
            content: "Error: " + String(err),
          });

          chatStore.setLoading(false);
        }
      } finally {
        abortControllerRef.current = null;
      }
    },
    [cleanupStoppedConversations, startStream]
  );

  const handleSend = useCallback(
    async (text: string) => {
      lastUserMessageRef.current = text;

      if (editingMessageIdRef.current) {
        chatStore.removeFrom(
          editingMessageIdRef.current
        );

        editingMessageIdRef.current = null;
      }

      const userMessage = {
        id: Date.now().toString(),
        role: "user" as const,
        content: text,
      };

      chatStore.addMessage(userMessage);

      chatStore.setCurrentInput("");

      await sendToAi(text);
    },
    [sendToAi]
  );

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();

      abortControllerRef.current = null;
    }

    stopStream();

    editingMessageIdRef.current = null;

    if (
      aiMessageAddedRef.current &&
      streamingAiIdRef.current
    ) {
      chatStore.removeFrom(
        streamingAiIdRef.current
      );

      streamingAiIdRef.current = null;

      chatStore.setStreamingAiId(null);
    } else {
      chatStore.setStreamingAiId(null);

      streamingAiIdRef.current = null;
    }

    chatStore.addMessage({
      id: Date.now().toString() + "_stopped",
      role: "assistant",
      content: "pesan telah dihentikan",
    });

    chatStore.setLoading(false);
  };

  const handleRetry = useCallback(
    async (text: string, retryMessageId: string) => {
      const messages = chatStore.getState().messages;

      const retryIndex = messages.findIndex(
        (m) => m.id === retryMessageId
      );

      if (retryIndex === -1) return;

      const preservedMessages = messages.slice(
        0,
        retryIndex + 1
      );

      chatStore.setMessages(preservedMessages);

      await sendToAi(text);
    },
    [sendToAi]
  );

  const handleRegenerate = useCallback(
    async (
      userText: string,
      aiMessageId: string
    ) => {
      const messages = chatStore.getState().messages;

      const aiIndex = messages.findIndex(
        (m) => m.id === aiMessageId
      );

      if (aiIndex === -1) return;

      const preservedMessages = messages.slice(
        0,
        aiIndex
      );

      chatStore.setMessages(preservedMessages);

      await sendToAi(userText);
    },
    [sendToAi]
  );

  const handleEditMessage = useCallback(
    (text: string, messageId: string) => {
      editingMessageIdRef.current = messageId;

      chatStore.setCurrentInput(text);
    },
    []
  );

  const handleCancelEdit = useCallback(() => {
    editingMessageIdRef.current = null;

    chatStore.setCurrentInput("");
  }, []);

  const handleTextChange = useCallback(
    (text: string) => {
      chatStore.setCurrentInput(text);
    },
    []
  );

  const isEditing =
    editingMessageIdRef.current !== null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "transparent",
        position: "relative",
      }}
    >
      <MessageListView
        isLoading={isLoading}
        isDesktop={isDesktop}
        onEditMessage={handleEditMessage}
        onRetryMessage={handleRetry}
        onRegenerateMessage={handleRegenerate}
        editingMessageId={
          editingMessageIdRef.current
        }
        extraBottomPadding={keyboardHeight}
      />

      <div
        style={{
          position: "fixed",
          bottom: keyboardHeight,
          left: 0,
          right: 0,
          zIndex: 5,
          pointerEvents: "none",
          paddingLeft: isDesktop
            ? "260px"
            : "0",
          transition: isDesktop
            ? "padding-left 0.3s ease"
            : "bottom 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
          backgroundColor: "transparent",
          willChange: "bottom",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            maxWidth: "100%",
            margin: "0 auto",
          }}
        >
          <ChatInputBar
            text={currentInput || ""}
            onTextChange={handleTextChange}
            onSend={handleSend}
            onStop={handleStop}
            onCancelEdit={handleCancelEdit}
            disabled={isLoading}
            isLoading={isLoading}
            isEditing={isEditing}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatSessionContainer;
