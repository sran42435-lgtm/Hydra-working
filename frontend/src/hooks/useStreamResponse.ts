import { useRef, useCallback } from "react";
import { chatStore } from "../store/chat_state_store";

const CHUNK_SIZE = 4; // kata per kemunculan

export function useStreamResponse() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startStream = useCallback(
    (fullText: string, messageId: string, onDone: () => void) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const words = fullText.split(" ");
      const chunks: string[] = [];
      for (let i = 0; i < words.length; i += CHUNK_SIZE) {
        chunks.push(words.slice(i, i + CHUNK_SIZE).join(" "));
      }

      let index = 0;
      chatStore.updateMessageContent(messageId, "");

      timerRef.current = setInterval(() => {
        index++;
        if (index <= chunks.length) {
          const partial = chunks.slice(0, index).join(" ");
          chatStore.updateMessageContent(messageId, partial);
        } else {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          onDone();
        }
      }, 200); // lebih lambat, 200ms per chunk
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
