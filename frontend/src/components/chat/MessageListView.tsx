import React, { useEffect, useState, useMemo, useRef } from "react";
import { chatStore, Message } from "../../store/chat_state_store";
import { HydraIcon } from "../ui/HydraIcon";

export const MessageListView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(chatStore.getState().messages);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  // Auto‑scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mergedMessages]);

  return (
    <div style={{
      flex: 1,
      overflowY: "auto",
      padding: "60px 16px 110px",   // increased bottom padding from 90px to 110px
      backgroundColor: "#fafafa",
    }}>
      {mergedMessages.length === 0 && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "#1a1a1a",
          textAlign: "center",
        }}>
          <HydraIcon size={48} />
          <p style={{ marginTop: 12, color: "#1a1a1a" }}>Kirim pesan untuk memulai</p>
        </div>
      )}
      {mergedMessages.map((msg) => {
        const isStoppedMessage = msg.id.endsWith("_stopped");

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
                padding: "8px 0",
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

        // User message
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

      {/* Invisible element for auto‑scroll */}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageListView;
