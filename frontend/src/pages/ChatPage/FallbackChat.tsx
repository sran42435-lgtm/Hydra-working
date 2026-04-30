import React, { useState, useRef, useEffect } from "react";
import { HydraIcon } from "../../components/ui/HydraIcon";

interface Message { role: "user" | "assistant"; content: string; }

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

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
    } finally { setLoading(false); }
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "#f8f8f8", color: "#1a1a1a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.05)", backgroundColor: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
        <HydraIcon size={22} />
        Hydra AI
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 12px", backgroundImage: "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.5) 0%, #f8f8f8 70%)" }}>
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
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 12, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "75%", padding: "12px 18px", borderRadius: 20,
              backgroundColor: m.role === "user" ? "rgba(224,123,90,0.75)" : "rgba(255,255,255,0.55)",
              backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              color: m.role === "user" ? "#fff" : "#1a1a1a",
              borderTopRightRadius: m.role === "user" ? 4 : 20,
              borderTopLeftRadius: m.role === "user" ? 20 : 4,
              fontSize: 14, lineHeight: 1.5, wordBreak: "break-word",
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              border: "1px solid rgba(255,255,255,0.5)",
            }}>
              {m.content}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} style={{ height: 8 }} />
      </div>

      <div style={{
        padding: "8px 16px 16px",
        display: "flex",
        justifyContent: "center",
      }}>
        <div style={{
          width: "100%",
          maxWidth: 560,
          display: "flex",
          alignItems: "center",
          backgroundColor: "rgba(255,255,255,0.8)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderRadius: 30,
          boxShadow: "0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
          border: "1px solid rgba(0,0,0,0.04)",
          padding: "4px",
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
            placeholder="Ketik pesan..."
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 44px 10px 18px",
              borderRadius: 26,
              border: "none",
              backgroundColor: "transparent",
              color: "#1a1a1a",
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "none",
              backgroundColor: loading ? "#ccc" : "#E07B5A",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(224,123,90,0.25)",
              flexShrink: 0,
              marginRight: 2,
            }}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FallbackChat;
