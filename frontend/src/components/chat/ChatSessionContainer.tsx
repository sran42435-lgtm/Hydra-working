import React, { useRef, useState, useEffect, useCallback } from "react";
import { chatStore } from "../../store/chat_state_store";
import { useChatStore } from "./useChatStore";
import { ChatInputBar } from "./ChatInputBar";
import { MessageListView } from "./MessageListView";
import { useStreamResponse } from "../../hooks/useStreamResponse";

interface ChatSessionContainerProps {
  isDesktop?: boolean;
}

export const ChatSessionContainer: React.FC<ChatSessionContainerProps> = ({ isDesktop = false }) => {
  const abortControllerRef = useRef<AbortController | null>(null);
  const { isLoading, currentInput } = useChatStore();
  const { startStream, stopStream } = useStreamResponse();

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const lastUserMessageRef = useRef<string>("");
  const editingMessageIdRef = useRef<string | null>(null);
  const streamingAiIdRef = useRef<string | null>(null);
  const aiMessageAddedRef = useRef(false);
  const pendingCleanupUserMsgIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isDesktop || !window.visualViewport) return;
    const handleViewportResize = () => {
      const viewport = window.visualViewport!;
      const windowHeight = window.innerHeight;
      const raw = windowHeight - viewport.height;
      setKeyboardHeight(raw > 0 ? raw * 0.01 : 0);
    };
    window.visualViewport.addEventListener("resize", handleViewportResize);
    window.visualViewport.addEventListener("scroll", handleViewportResize);
    return () => {
      window.visualViewport.removeEventListener("resize", handleViewportResize);
      window.visualViewport.removeEventListener("scroll", handleViewportResize);
    };
  }, [isDesktop]);

  const sendToAi = useCallback(async (text: string) => {
    chatStore.setLoading(true);
    aiMessageAddedRef.current = false;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });
      const data = await res.json();
      
      // ** Bersihkan stopped message & user lama jika ada (pakai deleteMessage) **
      if (pendingCleanupUserMsgIdRef.current) {
        const messages = chatStore.getState().messages;
        // Cari stopped message terbaru
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].id.endsWith("_stopped")) {
            chatStore.deleteMessage(messages[i].id);
            break;
          }
        }
        chatStore.deleteMessage(pendingCleanupUserMsgIdRef.current);
        pendingCleanupUserMsgIdRef.current = null;
      }
      
      const aiText = data.response || "(tidak ada balasan)";
      const aiMessageId = Date.now().toString() + "_ai";
      chatStore.addMessage({ id: aiMessageId, role: "assistant", content: "" });
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
        // stop ditekan
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
  }, [startStream]);

  const handleSend = useCallback(async (text: string) => {
    lastUserMessageRef.current = text;

    if (editingMessageIdRef.current) {
      chatStore.removeFrom(editingMessageIdRef.current);
      editingMessageIdRef.current = null;
    } else {
      const messages = chatStore.getState().messages;
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.id.endsWith("_stopped")) {
        // Simpan ID user message tepat sebelum stopped untuk dibersihkan nanti
        for (let i = messages.length - 2; i >= 0; i--) {
          if (messages[i].role === "user") {
            pendingCleanupUserMsgIdRef.current = messages[i].id;
            break;
          }
        }
      }
    }

    const userMessage = { id: Date.now().toString(), role: "user" as const, content: text };
    chatStore.addMessage(userMessage);
    chatStore.setCurrentInput("");
    await sendToAi(text);
  }, [sendToAi]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    stopStream();
    editingMessageIdRef.current = null;
    pendingCleanupUserMsgIdRef.current = null; // batalkan pembersihan tertunda

    if (aiMessageAddedRef.current && streamingAiIdRef.current) {
      chatStore.removeFrom(streamingAiIdRef.current);
      streamingAiIdRef.current = null;
      chatStore.setStreamingAiId(null);

      chatStore.addMessage({
        id: Date.now().toString() + "_stopped",
        role: "assistant",
        content: "pesan telah dihentikan",
      });
    } else {
      chatStore.setStreamingAiId(null);
      streamingAiIdRef.current = null;

      chatStore.addMessage({
        id: Date.now().toString() + "_stopped",
        role: "assistant",
        content: "pesan telah dihentikan",
      });
    }

    chatStore.setLoading(false);
  };

  const handleRetry = useCallback(async (text: string) => {
    const messages = chatStore.getState().messages;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        chatStore.removeFrom(messages[i].id);
        break;
      }
    }
    pendingCleanupUserMsgIdRef.current = null;
    await handleSend(text);
  }, [handleSend]);

  const handleRegenerate = useCallback(async (userText: string, aiMessageId: string) => {
    chatStore.removeFrom(aiMessageId);
    pendingCleanupUserMsgIdRef.current = null;
    await sendToAi(userText);
  }, [sendToAi]);

  const handleEditMessage = useCallback((text: string, messageId: string) => {
    editingMessageIdRef.current = messageId;
    chatStore.setCurrentInput(text);
  }, []);

  const handleCancelEdit = useCallback(() => {
    editingMessageIdRef.current = null;
    chatStore.setCurrentInput("");
  }, []);

  const handleTextChange = useCallback((text: string) => {
    chatStore.setCurrentInput(text);
  }, []);

  const isEditing = editingMessageIdRef.current !== null;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      backgroundColor: "transparent",
      position: "relative",
    }}>
      <MessageListView
        isLoading={isLoading}
        isDesktop={isDesktop}
        onEditMessage={handleEditMessage}
        onRetryMessage={handleRetry}
        onRegenerateMessage={handleRegenerate}
        editingMessageId={editingMessageIdRef.current}
        extraBottomPadding={keyboardHeight}
      />

      <div style={{
        position: "fixed",
        bottom: keyboardHeight,
        left: 0,
        right: 0,
        zIndex: 5,
        pointerEvents: "none",
        paddingLeft: isDesktop ? "260px" : "0",
        transition: isDesktop ? "padding-left 0.3s ease" : "bottom 0.1s ease-out",
        backgroundColor: "transparent",
      }}>
        <div style={{
          pointerEvents: "auto",
          maxWidth: "100%",
          margin: "0 auto",
        }}>
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
