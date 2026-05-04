import React, { useEffect, useState, useMemo } from "react";
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

  // Merge consecutive assistant messages into one paragraph
  const mergedMessages = useMemo(() => {
    const result: Message[] = [];
    for (let i = 0; i < messages.length; i++) {
      const current = messages[i];
      if (current.id.endsWith("_stopped")) {
        result.push(current);
        continue;
      }
      if (current.role === "assistant") {
        const prev = result[result.length - 1];
        if (prev && prev.role === "assistant" && !prev.id.endsWith("_stopped")) {
          prev.content += " " + current.content;
          prev.id = current.id;
          continue;
        }
      }
      result.push({ ...current });
    }
    return result;
  }, [messages]);

  return (
    <div style={{
      flex: 1,
      overflowY: "auto",
      padding: "60px 16px 90px",
      backgroundColor: "#fafafa",
    }}>
      {mergedMessages.length === 0 && (
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
      {mergedMessages.map((msg) => {
        const isStoppedMessage = msg.id.endsWith("_stopped");

        // Stop message – gray, italic, small, right‑aligned
        if (isStoppedMessage) {
          return (
            <div key={msg.id} style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 12,
              paddingRight: 4,
            }}>
              <span style={{
                color: "#999",
                fontStyle: "italic",
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                fontWeight: 500,
              }}>
                {msg.content}
              </span>
            </div>
          );
        }

        // AI message: plain text, FULL WIDTH, flush left, no extra padding
        if (msg.role === "assistant") {
          const cleanContent = msg.content.replace(/[\r\n]+/g, " ").trim();
          return (
            <div key={msg.id} style={{
              marginBottom: 12,
              display: "flex",
              justifyContent: "flex-start",
            }}>
              <div style={{
                width: "100%",
                padding: "8px 0",            // no horizontal padding, text hugs left edge
                color: "#1a1a1a",
                fontFamily: "'Outfit', sans-serif",
                fontSize: 18,
                fontWeight: 900,
                lineHeight: 1.5,
                whiteSpace: "normal",
                overflowWrap: "break-word",
              }}>
                {cleanContent}
              </div>
            </div>
          );
        }

        // User message: orange bubble, right‑aligned
        return (
          <div key={msg.id} style={{
            marginBottom: 12,
            display: "flex",
            justifyContent: "flex-end",
          }}>
            <div style={{
              maxWidth: "75%",
              padding: "12px 18px",
              borderRadius: 20,
              backgroundColor: "rgba(224,123,90,0.75)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "#fff",
              borderTopRightRadius: 4,
              borderTopLeftRadius: 20,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 18,
              fontWeight: 900,
              lineHeight: 1.5,
              whiteSpace: "normal",
              overflowWrap: "break-word",
              border: "1px solid rgba(255,255,255,0.5)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}>
              {msg.content}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageListView;
