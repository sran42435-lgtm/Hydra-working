/**
 * useChatStore Hook - Phase 1
 * Hook untuk membaca state chat secara reaktif di komponen React.
 */

import { useSyncExternalStore } from "react";
import { chatStore } from "../../store/chat_state_store";
import type { Message } from "../../types/chat.types";

export function useChatStore(): {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
} {
  return useSyncExternalStore(
    chatStore.subscribe.bind(chatStore),
    () => chatStore.getState()   // arrow function preserves this context
  );
}
