/**
 * Session State Store - Phase 1
 * Menyimpan state sesi chat: session ID dan status koneksi.
 * Diimplementasikan dengan simple reactive store (tanpa library eksternal).
 */

type Listener = () => void;

interface SessionState {
  sessionId: string | null;
  isConnected: boolean;
  lastActive: string | null;
}

const initialState: SessionState = {
  sessionId: null,
  isConnected: false,
  lastActive: null,
};

let state: SessionState = { ...initialState };
const listeners: Set<Listener> = new Set();

function notify(): void {
  listeners.forEach((fn) => fn());
}

export const sessionStore = {
  getState(): SessionState {
    return state;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setSessionId(id: string): void {
    state = {
      ...state,
      sessionId: id,
      lastActive: new Date().toISOString(),
    };
    notify();
  },

  setConnected(connected: boolean): void {
    state = { ...state, isConnected: connected };
    notify();
  },

  reset(): void {
    state = { ...initialState };
    notify();
  },
};
