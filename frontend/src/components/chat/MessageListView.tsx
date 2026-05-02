import React, { useEffect, useState } from "react";
import { chatStore, Message } from "../../store/chat_state_store";
import { HydraIcon } from "../ui/HydraIcon";

export const MessageListView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(chatStore.getState().messages);

  useEffect(() => {
    const unsubscribe = chatStore.subscribe(() =>
      setMessages([...chatStore.getState().messages])
    );
    return unsubscribe;
  }, []);

  return (
    <div style={{
      flex: 1,
      overflowY: "auto",
      padding: "60px 16px 90px", // padding-bottom 90px agar input bar tidak menutupi pesan
      backgroundColor: "#fafafa",
    }}>
      {messages.length === 0 && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "#999",
          textAlign: "center",
        }}>
          <HydraIcon size={48} />
          <p style={{ marginTop: 12 }}>Kirim pesan untuk memulai</p>
        </div>
      )}
      {messages.map((msg) => (
        <div key={msg.id} style={{
          marginBottom: 12,
          display: "flex",
          justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
        }}>
          <div style={{
            maxWidth: "75%",
            padding: "12px 18px",
            borderRadius: 20,
            backgroundColor: msg.role === "user"
              ? "rgba(224,123,90,0.75)"
              : "rgba(255,255,255,0.55)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            color: msg.role === "user" ? "#fff" : "#1a1a1a",
            borderTopRightRadius: msg.role === "user" ? 4 : 20,
            borderTopLeftRadius: msg.role === "user" ? 20 : 4,
            fontFamily: "'Outfit', sans-serif",
            fontSize: 18,
            fontWeight: 900,
            lineHeight: 1.5,
            wordBreak: "break-word",
            border: "1px solid rgba(255,255,255,0.5)",
            boxShadow: msg.role === "user"
              ? "0 4px 12px rgba(0,0,0,0.15)"
              : "0 8px 24px rgba(0,0,0,0.05)",
          }}>
            {msg.content}
          </div>
        </div>
      ))}
    </div>
  );
};
