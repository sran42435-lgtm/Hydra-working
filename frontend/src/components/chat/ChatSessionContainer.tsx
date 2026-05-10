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

  const lastUserMessageRef = useRef<string>("");

  const editingMessageIdRef = useRef<string | null>(null);

  const streamingAiIdRef = useRef<string | null>(null);

  const aiMessageAddedRef = useRef(false);

  useEffect(() => {
    if (isDesktop || !window.visualViewport) return;

    const handleViewportResize = () => {
      const viewport = window.visualViewport!;
      const windowHeight = window.innerHeight;

      const raw = windowHeight - viewport.height;

      setKeyboardHeight(raw > 0 ? raw * 0.01 : 0);
    };

    window.visualViewport.addEventListener(
      "resize",
      handleViewportResize
    );

    window.visualViewport.addEventListener(
      "scroll",
      handleViewportResize
    );

    return () => {
      window.visualViewport.removeEventListener(
        "resize",
        handleViewportResize
      );

      window.visualViewport.removeEventListener(
        "scroll",
        handleViewportResize
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

        const aiText = data.response || "(tidak ada balasan)";

        const aiMessageId = Date.now().toString() + "_ai";

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

        if (err instanceof DOMException && err.name === "AbortError") {
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
        chatStore.removeFrom(editingMessageIdRef.current);

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

    if (aiMessageAddedRef.current && streamingAiIdRef.current) {
      chatStore.removeFrom(streamingAiIdRef.current);

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
    async (userText: string, aiMessageId: string) => {
      const messages = chatStore.getState().messages;

      const aiIndex = messages.findIndex(
        (m) => m.id === aiMessageId
      );

      if (aiIndex === -1) return;

      const preservedMessages = messages.slice(0, aiIndex);

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

  const handleTextChange = useCallback((text: string) => {
    chatStore.setCurrentInput(text);
  }, []);

  const isEditing = editingMessageIdRef.current !== null;

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
        editingMessageId={editingMessageIdRef.current}
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
          paddingLeft: isDesktop ? "260px" : "0",
          transition: isDesktop
            ? "padding-left 0.3s ease"
            : "bottom 0.1s ease-out",
          backgroundColor: "transparent",
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
