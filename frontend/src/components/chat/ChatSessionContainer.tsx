import React from "react";
import { chatStore } from "../../store/chat_state_store";
import { ChatInputBar } from "./ChatInputBar";
import { MessageListView } from "./MessageListView";

interface ChatSessionContainerProps {
  isDesktop?: boolean;
}

export const ChatSessionContainer: React.FC<ChatSessionContainerProps> = ({ isDesktop = false }) => {
  const handleSend = async (text: string) => {
    const userMessage = { id: Date.now().toString(), role: "user" as const, content: text };
    chatStore.addMessage(userMessage);
    chatStore.setLoading(true);
    try {
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      chatStore.addMessage({
        id: Date.now().toString() + "_ai",
        role: "assistant",
        content: data.response || "(tidak ada balasan)",
      });
    } catch (err) {
      chatStore.addMessage({
        id: Date.now().toString() + "_err",
        role: "assistant",
        content: "Error: " + String(err),
      });
    } finally {
      chatStore.setLoading(false);
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
      {/* Input bar fixed di bawah */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 5,
        pointerEvents: "none",
        paddingLeft: isDesktop ? "260px" : "0", // Geser ke kanan di Desktop agar tidak masuk panel
        transition: "padding-left 0.3s ease",
        backgroundColor: "transparent",
      }}>
        <div style={{
          pointerEvents: "auto",
          maxWidth: "100%",
          margin: "0 auto",
        }}>
          <ChatInputBar onSend={handleSend} disabled={chatStore.getState().isLoading} />
        </div>
      </div>
    </div>
  );
};
