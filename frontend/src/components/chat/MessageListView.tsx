import React, { useEffect, useState } from "react";
import { chatStore, Message } from "../../store/chat_state_store";

export const MessageListView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(chatStore.getState().messages);

  useEffect(() => {
    const unsubscribe = chatStore.subscribe(() => {
      setMessages([...chatStore.getState().messages]);
    });
    return unsubscribe;
  }, []);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
      {messages.map((msg) => (
        <div key={msg.id} style={{
          marginBottom: 10,
          display: "flex",
          justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
        }}>
          <div style={{
            maxWidth: "75%",
            padding: "8px 14px",
            borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            backgroundColor: msg.role === "user" ? "#3b82f6" : "#1e293b",
            color: "#f1f5f9",
          }}>
            {msg.content}
          </div>
        </div>
      ))}
    </div>
  );
};
