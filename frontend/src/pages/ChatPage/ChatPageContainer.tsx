import React, { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ChatPageContainer: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content, session_id: sessionId }),
      });
      const data = await res.json();
      if (data.session_id && !sessionId) setSessionId(data.session_id);
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
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
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20, height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#0f172a", color: "#f8fafc" }}>
      <h2 style={{ textAlign: "center", marginBottom: 10 }}>🐉 Hydra AI Chat</h2>
      <div style={{ flex: 1, overflowY: "auto", marginBottom: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 10, textAlign: m.role === "user" ? "right" : "left" }}>
            <div style={{
              display: "inline-block",
              padding: "8px 14px",
              borderRadius: 12,
              backgroundColor: m.role === "user" ? "#3b82f6" : "#1e293b",
              color: "#f8fafc",
            }}>
              {m.content}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #334155" }}>
        <input
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #475569", backgroundColor: "#1e293b", color: "#f8fafc" }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Ketik pesan..."
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          style={{ padding: "10px 16px", borderRadius: 8, border: "none", backgroundColor: loading ? "#475569" : "#3b82f6", color: "#fff", fontWeight: 600 }}
        >
          {loading ? "..." : "Kirim"}
        </button>
      </div>
    </div>
  );
};

export default ChatPageContainer;
