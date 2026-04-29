import React, { useState, useRef, useEffect } from "react";
import { MessageListView } from "./MessageListView";
import { ChatInputBar } from "./ChatInputBar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export const ChatSessionContainer: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async (text: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response || "(tidak ada balasan)",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Error: " + String(e),
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <MessageListView messages={messages} isTyping={loading} />
        <div ref={chatEndRef} />
      </div>
      <ChatInputBar onSend={handleSend} disabled={loading} />
    </div>
  );
};
