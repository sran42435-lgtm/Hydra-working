/**
 * Chat Session Container - Phase 1
 * Container utama untuk sesi chat.
 * Menggabungkan MessageListView, ChatInputBar, dan AutoScrollController.
 * Menangani logika pengiriman pesan dan pembaruan state.
 */

import React, { useCallback } from "react";
import type { Message } from "../../types/chat.types";
import { chatStore } from "../../store/chat_state_store";
import { sessionStore } from "../../store/session_state_store";
import { bffApiClient } from "../../services/bff_api_client";
import { MessageListView } from "./MessageListView";
import { ChatInputBar } from "./ChatInputBar";
import { AutoScrollController } from "./AutoScrollController";
import { useChatStore } from "./useChatStore";

export const ChatSessionContainer: React.FC = () => {
  // Gunakan custom hook untuk membaca state secara reaktif
  const { messages, isLoading } = useChatStore();

  const handleSend = useCallback(async (message: string) => {
    // 1. Tambahkan pesan user secara optimistik
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };
    chatStore.addMessage(userMessage);

    // 2. Set loading true
    chatStore.setLoading(true);

    try {
      // 3. Kirim ke BFF Layer
      const sessionId = sessionStore.getState().sessionId;
      const response = await bffApiClient.chat({
        message,
        session_id: sessionId || undefined,
      });

      // 4. Simpan session_id jika baru
      if (response.session_id && !sessionId) {
        sessionStore.setSessionId(response.session_id);
      }

      // 5. Tambahkan pesan assistant
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.response,
        timestamp: new Date().toISOString(),
      };
      chatStore.addMessage(assistantMessage);
    } catch (error) {
      // 6. Tambahkan pesan error
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Maaf, terjadi kesalahan: ${error instanceof Error ? error.message : "Gagal mengirim pesan"}`,
        timestamp: new Date().toISOString(),
      };
      chatStore.addMessage(errorMessage);
    } finally {
      // 7. Set loading false
      chatStore.setLoading(false);
    }
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "#0f172a",
      }}
    >
      <AutoScrollController dependency={messages.length}>
        <MessageListView
          messages={messages}
          isTyping={isLoading}
        />
      </AutoScrollController>
      <ChatInputBar
        onSend={handleSend}
        disabled={isLoading}
      />
    </div>
  );
};
