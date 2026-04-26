/**
 * useChatStore Hook - Phase 1
 * Hook untuk membaca state chat secara reaktif di komponen React.
 */

import { useState, useEffect, useSyncExternalStore } from "react";
import { chatStore } from "../../store/chat_state_store";
import type { Message } from "../../types/chat.types";

// Versi sederhana dengan useSyncExternalStore (React 18+)
export function useChatStore(): {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
} {
  return useSyncExternalStore(
    chatStore.subscribe,
    chatStore.getState
  );
}
