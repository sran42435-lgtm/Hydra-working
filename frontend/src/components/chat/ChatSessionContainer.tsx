import React, { useRef, useState } from "react";
import { chatStore } from "../../store/chat_state_store";
import { useChatStore } from "./useChatStore";
import { ChatInputBar } from "./ChatInputBar";
import { MessageListView } from "./MessageListView";

interface ChatSessionContainerProps {
  isDesktop?: boolean;
}

export const ChatSessionContainer: React.FC<ChatSessionContainerProps> = ({ isDesktop = false }) => {
  const { isLoading } = useChatStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Controlled input text (so we can restore it after stop)
  const [inputText, setInputText] = useState("");
  // Remember last sent user message for restoration
  const lastUserMessageRef = useRef<string>("");

  const handleSend = async (text: string) => {
    // Store the user's message for possible restoration
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
      chatStore.addMessage({
        id: Date.now().toString() + "_ai",
        role: "assistant",
        content: data.response || "(tidak ada balasan)",
      });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // stop was pressed – text will be restored in handleStop
      } else {
        chatStore.addMessage({
          id: Date.now().toString() + "_err",
          role: "assistant",
          content: "Error: " + String(err),
        });
      }
    } finally {
      abortControllerRef.current = null;
      chatStore.setLoading(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;

      // Add stopped message
      chatStore.addMessage({
        id: Date.now().toString() + "_stopped",
        role: "assistant",
        content: "pesan telah dihentikan",
      });
    }
    // Restore the last user message text back into the input
    setInputText(lastUserMessageRef.current);
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
