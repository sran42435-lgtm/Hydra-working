import React from "react";
import { chatStore } from "../../store/chat_state_store";
import { ChatInputBar } from "./ChatInputBar";
import { MessageListView } from "./MessageListView";

export const ChatSessionContainer: React.FC = () => {
  const handleSend = async (text: string) => {
    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: text,
    };
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
      console.error(err);
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
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <MessageListView />
      <ChatInputBar onSend={handleSend} disabled={chatStore.getState().isLoading} />
    </div>
  );
};
