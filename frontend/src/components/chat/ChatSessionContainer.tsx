import React, { useRef, useState, useCallback } from "react";
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
  const { isLoading } = useChatStore();
  const { startStream, stopStream } = useStreamResponse();

  const [inputText, setInputText] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const lastUserMessageRef = useRef<string>("");
  const streamingAiIdRef = useRef<string | null>(null);   // track the AI message being streamed

  const sendMessage = async (text: string) => {
    lastUserMessageRef.current = text;

    if (editingMessageId) {
      chatStore.removeFrom(editingMessageId);
      setEditingMessageId(null);
    }

    const userMessage = { id: Date.now().toString(), role: "user" as const, content: text };
    chatStore.addMessage(userMessage);
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
      streamingAiIdRef.current = aiMessageId;                  // mark as currently streaming

      startStream(aiText, aiMessageId, () => {
        streamingAiIdRef.current = null;                       // streaming finished naturally
        chatStore.setLoading(false);
      });
    } catch (err: unknown) {
      streamingAiIdRef.current = null;
      if (err instanceof DOMException && err.name === "AbortError") {
        // stop pressed – handled in handleStop
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
  };

  const handleSend = async (text: string) => {
    await sendMessage(text);
    setInputText("");
  };

  const handleStop = () => {
    // 1. Abort the fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // 2. Stop the streaming interval
    stopStream();

    // 3. Remove the partial AI message if it exists
    if (streamingAiIdRef.current) {
      chatStore.removeFrom(streamingAiIdRef.current);
      streamingAiIdRef.current = null;
    }

    setEditingMessageId(null);

    // 4. Add the stop warning
    chatStore.addMessage({
      id: Date.now().toString() + "_stopped",
      role: "assistant",
      content: "pesan telah dihentikan",
    });

    setInputText("");
    chatStore.setLoading(false);
  };

  const handleRetry = useCallback(async (text: string) => {
    // Remove the stopped user message and everything after it (the stop warning)
    const messages = chatStore.getState().messages;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        chatStore.removeFrom(messages[i].id);
        break;
      }
    }
    await sendMessage(text);
  }, []);

  const handleEditMessage = useCallback((text: string, messageId: string) => {
    setEditingMessageId(messageId);
    setInputText(text);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setInputText("");
  }, []);

  const handleTextChange = useCallback((text: string) => {
    setInputText(text);
  }, []);

  const isEditing = editingMessageId !== null;

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
        onEditMessage={handleEditMessage}
        onRetryMessage={handleRetry}
        editingMessageId={editingMessageId}
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
            text={inputText}
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
