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
  const [status, setStatus] = useState("⏳ Siap");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const addMessage = (role: "user" | "assistant", content: string) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, msg]);
  };

  const handleSend = async (text: string) => {
    addMessage("user", text);
    setLoading(true);
    setStatus("📤 Mengirim...");

    try {
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      setStatus(`📥 Status: ${res.status}`);

      const data = await res.json();
      if (data.response) {
        addMessage("assistant", data.response);
        setStatus("✅ OK");
      } else {
        addMessage("assistant", "❌ Respons kosong: " + JSON.stringify(data));
        setStatus("⚠️ Respons kosong");
      }
    } catch (e) {
      addMessage("assistant", "❌ Gagal: " + String(e));
      setStatus("❌ Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "hidden",
    }}>
      {/* Debug bar */}
      <div style={{
        padding: "4px 12px",
        fontSize: 11,
        color: "#94a3b8",
        backgroundColor: "#1e293b",
        borderBottom: "1px solid #334155",
        display: "flex",
        justifyContent: "space-between",
      }}>
        <span>Pesan: {messages.length}</span>
        <span>{status}</span>
      </div>

      <div style={{
        flex: 1,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}>
        <MessageListView messages={messages} isTyping={loading} />
        <div ref={chatEndRef} />
      </div>

      <ChatInputBar onSend={handleSend} disabled={loading} />
    </div>
  );
};
