/**
 * useStreamResponse Hook - Phase 1
 * Simulates streaming a text response word by word into the chat store.
 */

import { useRef, useCallback } from "react";
import { chatStore } from "../store/chat_state_store";

export function useStreamResponse() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Start streaming a response.
   * @param fullText - the complete text to stream.
   * @param messageId - the ID of the assistant message to update.
   * @param onDone - called when streaming finishes.
   */
  const startStream = useCallback(
    (fullText: string, messageId: string, onDone: () => void) => {
      // Clear any existing stream
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const words = fullText.split(" ");
      let index = 0;

      // Add empty placeholder to store first
      chatStore.updateMessageContent(messageId, "");

      timerRef.current = setInterval(() => {
        index++;
        if (index <= words.length) {
          const partial = words.slice(0, index).join(" ");
          chatStore.updateMessageContent(messageId, partial);
        } else {
          // Finish
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          chatStore.setLoading(false);   // end loading
          onDone();
        }
      }, 80); // 80ms per word – a bit slower, feels natural
    },
    []
  );

  const stopStream = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { startStream, stopStream };
}
