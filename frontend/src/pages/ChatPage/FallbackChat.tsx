import React, { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const FallbackChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.response || "(tidak ada balasan)" }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error: " + String(e) }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#0f172a", color: "#f8fafc", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "10px 16px", borderBottom: "1px solid #334155", fontSize: 16, fontWeight: 700 }}>🐉 Hydra AI</div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 12px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#64748b", marginTop: "40%" }}>
            <p style={{ fontSize: 40 }}>🐉</p>
            <p>Kirim pesan untuk memulai</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 8, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "80%", padding: "8px 14px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", backgroundColor: m.role === "user" ? "#3b82f6" : "#1e293b" }}>{m.content}</div>
          </div>
        ))}
        <div ref={chatEndRef} style={{ height: 8 }} />
      </div>
      <div style={{ display: "flex", gap: 8, padding: "8px 12px", borderTop: "1px solid #334155", backgroundColor: "#1e293b" }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} placeholder="Ketik pesan..." disabled={loading} style={{ flex: 1, padding: "10px 14px", borderRadius: 20, border: "1px solid #475569", backgroundColor: "#0f172a", color: "#f8fafc", fontSize: 14, outline: "none" }} />
        <button onClick={handleSend} disabled={loading} style={{ padding: "10px 16px", borderRadius: 20, border: "none", backgroundColor: loading ? "#475569" : "#3b82f6", color: "#fff", fontWeight: 600, fontSize: 14 }}>{loading ? "..." : "Kirim"}</button>
      </div>
    </div>
  );
};

export default FallbackChat;
