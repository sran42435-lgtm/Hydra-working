/**
 * Chat State Store - Phase 1
 * Menyimpan state chat: daftar pesan, status loading, dan error.
 * Diimplementasikan dengan simple reactive store (tanpa library eksternal).
 */

import type { Message } from "../types/chat.types";

type Listener = () => void;

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
};

let state: ChatState = { ...initialState };
const listeners: Set<Listener> = new Set();

function notify(): void {
  listeners.forEach((fn) => fn());
}

export const chatStore = {
  getState(): ChatState {
    return state;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  addMessage(message: Message): void {
    state = {
      ...state,
      messages: [...state.messages, message],
    };
    notify();
  },

  setLoading(loading: boolean): void {
    state = { ...state, isLoading: loading };
    notify();
  },

  setError(error: string | null): void {
    state = { ...state, error };
    notify();
  },

  clearMessages(): void {
    state = { ...state, messages: [] };
    notify();
  },

  reset(): void {
    state = { ...initialState };
    notify();
  },
};
