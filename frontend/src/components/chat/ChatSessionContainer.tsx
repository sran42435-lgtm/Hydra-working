import React from "react";
import { chatStore } from "../../store/chat_state_store";
import { ChatInputBar } from "./ChatInputBar";
import { MessageListView } from "./MessageListView";

export const ChatSessionContainer: React.FC = () => {
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
      {/* Input bar fixed di bawah dengan z-index rendah */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 5,
        pointerEvents: "none",
        backgroundColor: "transparent", // Pastikan tidak ada background yang mengganggu
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
