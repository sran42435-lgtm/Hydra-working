import React, { useRef } from "react";
import { chatStore } from "../../store/chat_state_store";
import { useChatStore } from "./useChatStore";
import { ChatInputBar } from "./ChatInputBar";
import { MessageListView } from "./MessageListView";

interface ChatSessionContainerProps {
  isDesktop?: boolean;
}

export const ChatSessionContainer: React.FC<ChatSessionContainerProps> = ({ isDesktop = false }) => {
  const abortControllerRef = useRef<AbortController | null>(null);
  const { isLoading } = useChatStore(); // ← now reactive, no crash

  const handleSend = async (text: string) => {
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
      chatStore.addMessage({
        id: Date.now().toString() + "_ai",
        role: "assistant",
        content: data.response || "(tidak ada balasan)",
      });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // intentional stop – do nothing, message added in handleStop
      } else {
        chatStore.addMessage({
          id: Date.now().toString() + "_err",
          role: "assistant",
          content: "Error: " + String(err),
        });
      }
    } finally {
      abortControllerRef.current = null;
      chatStore.setLoading(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;

      chatStore.addMessage({
        id: Date.now().toString() + "_stopped",
        role: "assistant",
        content: "Pesan telah dihentikan.",
      });
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      backgroundColor: "transparent",
      position: "relative",
    }}>
      <MessageListView />
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
            onSend={handleSend}
            onStop={handleStop}
            disabled={isLoading}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatSessionContainer;
