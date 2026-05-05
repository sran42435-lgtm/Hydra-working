import React, { useRef, useState } from "react";
import { chatStore } from "../../store/chat_state_store";
import { useChatStore } from "./useChatStore";
import { ChatInputBar } from "./ChatInputBar";
import { MessageListView } from "./MessageListView";
import { useStreamResponse } from "../../hooks/useStreamResponse";

interface ChatSessionContainerProps {
  isDesktop?: boolean;
}

export const ChatSessionContainer: React.FC<ChatSessionContainerProps> = ({ isDesktop = false }) => {
  const abortControllerRef = useRef<AbortController | null>(null);
  const { isLoading } = useChatStore();
  const { startStream, stopStream } = useStreamResponse();

  const [inputText, setInputText] = useState("");
  const lastUserMessageRef = useRef<string>("");

  const handleSend = async (text: string) => {
    lastUserMessageRef.current = text;

    const userMessage = { id: Date.now().toString(), role: "user" as const, content: text };
    chatStore.addMessage(userMessage);
    chatStore.setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });
      const data = await res.json();
      const aiText = data.response || "(tidak ada balasan)";

      // Create placeholder AI message and stream into it
      const aiMessageId = Date.now().toString() + "_ai";
      chatStore.addMessage({ id: aiMessageId, role: "assistant", content: "" });

      startStream(aiText, aiMessageId, () => {
        chatStore.setLoading(false);    // done streaming
      });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // stop pressed – handled in handleStop
      } else {
        chatStore.addMessage({
          id: Date.now().toString() + "_err",
          role: "assistant",
          content: "Error: " + String(err),
        });
        chatStore.setLoading(false);
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    stopStream();   // stop word‑by‑word streaming

    chatStore.addMessage({
      id: Date.now().toString() + "_stopped",
      role: "assistant",
      content: "pesan telah dihentikan",
    });

    setInputText(lastUserMessageRef.current);
    chatStore.setLoading(false);
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      backgroundColor: "transparent",
      position: "relative",
    }}>
      <MessageListView />
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 5,
        pointerEvents: "none",
        paddingLeft: isDesktop ? "260px" : "0",
        transition: "padding-left 0.3s ease",
        backgroundColor: "transparent",
      }}>
        <div style={{
          pointerEvents: "auto",
          maxWidth: "100%",
          margin: "0 auto",
        }}>
          <ChatInputBar
            text={inputText}
            onTextChange={setInputText}
            onSend={handleSend}
            onStop={handleStop}
            disabled={isLoading}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatSessionContainer;
