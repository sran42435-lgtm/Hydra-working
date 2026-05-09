import React, { useRef, useCallback } from "react";
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
  const { isLoading, currentInput } = useChatStore();   // baca currentInput dari store
  const { startStream, stopStream } = useStreamResponse();

  const lastUserMessageRef = useRef<string>("");
  const editingMessageIdRef = useRef<string | null>(null);
  const streamingAiIdRef = useRef<string | null>(null);

  const sendToAi = useCallback(async (text: string) => {
    chatStore.setLoading(true);
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
      const aiText = data.response || "(tidak ada balasan)";
      const aiMessageId = Date.now().toString() + "_ai";
      chatStore.addMessage({ id: aiMessageId, role: "assistant", content: "" });
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
        // stop pressed
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
    }
    const userMessage = { id: Date.now().toString(), role: "user" as const, content: text };
    chatStore.addMessage(userMessage);
    chatStore.setCurrentInput("");   // kosongkan input setelah kirim
    await sendToAi(text);
  }, [sendToAi]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    stopStream();
    editingMessageIdRef.current = null;

    chatStore.setStreamingAiId(null);

    const streamingId = chatStore.getState().streamingAiId;
    if (streamingId) {
      chatStore.removeFrom(streamingId);
      streamingAiIdRef.current = null;
    }

    chatStore.addMessage({
      id: Date.now().toString() + "_stopped",
      role: "assistant",
      content: "pesan telah dihentikan",
    });

    // Jangan hapus input, biarkan tetap apa adanya
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
    await handleSend(text);
  }, [handleSend]);

  const handleRegenerate = useCallback(async (userText: string, aiMessageId: string) => {
    chatStore.removeFrom(aiMessageId);
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
      />
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 5,
        pointerEvents: "none",
        paddingLeft: isDesktop ? "260px" : "0",
        transition: "padding-left 0.3s ease",
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
