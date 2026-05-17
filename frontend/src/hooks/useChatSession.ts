// frontend/src/hooks/useChatSession.ts
import { useRef, useCallback } from 'react';
import { chatStore } from '../store/chat_state_store';
import { useStreamResponse } from './useStreamResponse';

export function useChatSession() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string>('');
  const editingMessageIdRef = useRef<string | null>(null);
  const streamingAiIdRef = useRef<string | null>(null);
  const aiMessageAddedRef = useRef(false);

  const { startStream, stopStream } = useStreamResponse();

  const cleanupStoppedConversations = useCallback(() => {
    const messages = chatStore.getState().messages;
    const cleaned: typeof messages = [];
    for (let i = 0; i < messages.length; i++) {
      const current = messages[i];
      const next = messages[i + 1];
      if (current.role === 'user' && next && next.id.endsWith('_stopped')) {
        i++;
        continue;
      }
      cleaned.push(current);
    }
    chatStore.setMessages(cleaned);
  }, []);

  const sendToAi = useCallback(
    async (text: string) => {
      chatStore.setLoading(true);
      aiMessageAddedRef.current = false;
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await fetch('/api/v1/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
          signal: controller.signal,
        });
        const data = await res.json();
        cleanupStoppedConversations();
        const aiText = data.response || '(tidak ada balasan)';
        const aiMessageId = Date.now().toString() + '_ai';

        chatStore.addMessage({
          id: aiMessageId,
          role: 'assistant',
          content: '',
        });
        aiMessageAddedRef.current = true;
        streamingAiIdRef.current = aiMessageId;
        chatStore.setStreamingAiId(aiMessageId);

        startStream(aiText, aiMessageId, () => {
          streamingAiIdRef.current = null;
          chatStore.setStreamingAiId(null);
          chatStore.setLoading(false);
        });
      } catch (err: unknown) {
        streamingAiIdRef.current = null;
        chatStore.setStreamingAiId(null);

        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          chatStore.addMessage({
            id: Date.now().toString() + '_err',
            role: 'assistant',
            content: 'Error: ' + String(err),
          });
          chatStore.setLoading(false);
        }
      } finally {
        abortControllerRef.current = null;
      }
    },
    [cleanupStoppedConversations, startStream]
  );

  const handleSend = useCallback(
    async (text: string) => {
      lastUserMessageRef.current = text;

      if (editingMessageIdRef.current) {
        chatStore.removeFrom(editingMessageIdRef.current);
        editingMessageIdRef.current = null;
      }

      const userMessage = {
        id: Date.now().toString(),
        role: 'user' as const,
        content: text,
      };
      chatStore.addMessage(userMessage);
      chatStore.setCurrentInput('');
      await sendToAi(text);
    },
    [sendToAi]
  );

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    stopStream();
    editingMessageIdRef.current = null;

    if (aiMessageAddedRef.current && streamingAiIdRef.current) {
      chatStore.removeFrom(streamingAiIdRef.current);
      streamingAiIdRef.current = null;
      chatStore.setStreamingAiId(null);
    } else {
      chatStore.setStreamingAiId(null);
      streamingAiIdRef.current = null;
    }

    chatStore.addMessage({
      id: Date.now().toString() + '_stopped',
      role: 'assistant',
      content: 'pesan telah dihentikan',
    });
    chatStore.setLoading(false);
  }, [stopStream]);

  const handleRetry = useCallback(
    async (text: string, retryMessageId: string) => {
      const messages = chatStore.getState().messages;
      const retryIndex = messages.findIndex((m) => m.id === retryMessageId);
      if (retryIndex === -1) return;

      const preservedMessages = messages.slice(0, retryIndex + 1);
      chatStore.setMessages(preservedMessages);
      await sendToAi(text);
    },
    [sendToAi]
  );

  const handleRegenerate = useCallback(
    async (userText: string, aiMessageId: string) => {
      const messages = chatStore.getState().messages;
      const aiIndex = messages.findIndex((m) => m.id === aiMessageId);
      if (aiIndex === -1) return;

      const preservedMessages = messages.slice(0, aiIndex);
      chatStore.setMessages(preservedMessages);
      await sendToAi(userText);
    },
    [sendToAi]
  );

  const handleEditMessage = useCallback((text: string, messageId: string) => {
    editingMessageIdRef.current = messageId;
    chatStore.setCurrentInput(text);
  }, []);

  const handleCancelEdit = useCallback(() => {
    editingMessageIdRef.current = null;
    chatStore.setCurrentInput('');
  }, []);

  const handleTextChange = useCallback((text: string) => {
    chatStore.setCurrentInput(text);
  }, []);

  return {
    editingMessageIdRef,
    handleSend,
    handleStop,
    handleRetry,
    handleRegenerate,
    handleEditMessage,
    handleCancelEdit,
    handleTextChange,
  };
}
