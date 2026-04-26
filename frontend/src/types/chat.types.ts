/**
 * Chat Types - Phase 1
 * Type definitions untuk komponen chat di frontend.
 */

/** Role pengirim pesan */
export type MessageRole = "user" | "assistant";

/** Struktur satu pesan dalam percakapan */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string; // ISO 8601
}

/** Request body untuk POST /api/chat (via BFF) */
export interface ChatRequest {
  message: string;
  session_id?: string;
}

/** Response body dari POST /api/chat */
export interface ChatResponse {
  session_id: string;
  response: string;
  trace_id: string;
}

/** State untuk satu sesi chat */
export interface Session {
  id: string;
  createdAt: string;
  lastActive: string;
}

/** State global untuk chat */
export interface ChatState {
  sessionId: string | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}
