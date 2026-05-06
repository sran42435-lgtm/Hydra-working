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

  const handleSend = async (text: string) => {
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

      startStream(aiText, aiMessageId, () => {
        chatStore.setLoading(false);
      });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // stop pressed – message stays as bubble + warning
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

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    stopStream();
    setEditingMessageId(null);

    chatStore.addMessage({
      id: Date.now().toString() + "_stopped",
      role: "assistant",
      content: "pesan telah dihentikan",
    });

    // Clear the input bar — do NOT restore the old message
    setInputText("");
    chatStore.setLoading(false);
  };

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
