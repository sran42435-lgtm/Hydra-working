// frontend/src/components/chat/useChatStore.ts

import { useSyncExternalStore } from "react";
import { chatStore } from "../../store/chat_state_store";
import type { ChatState } from "../../store/chat_state_store";

export function useChatStore(): ChatState {
  return useSyncExternalStore(
    chatStore.subscribe.bind(chatStore),
    () => chatStore.getState()
  );
}
