/**
 * BFF API Client - Phase 1
 * Client khusus untuk komunikasi dengan BFF Layer.
 * Menggunakan httpClient sebagai dasar, dengan method spesifik untuk chat.
 */

import { httpClient } from "./http_api_client";
import type { ChatRequest, ChatResponse } from "../types/chat.types";

class BffApiClient {
  /**
   * Mengirim pesan chat ke BFF Layer.
   *
   * @param request - Object berisi message dan optional session_id.
   * @returns Promise<ChatResponse> - Respons dari backend.
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    // Hanya kirim properti yang diperlukan
    const body: Record<string, unknown> = {
      message: request.message,
    };
    if (request.session_id) {
      body.session_id = request.session_id;
    }

    return httpClient.post<ChatResponse>("/chat", body);
  }

  /**
   * Cek kesehatan BFF Layer.
   */
  async health(): Promise<{ status: string }> {
    return httpClient.get<{ status: string }>("/health");
  }
}

export const bffApiClient = new BffApiClient();
