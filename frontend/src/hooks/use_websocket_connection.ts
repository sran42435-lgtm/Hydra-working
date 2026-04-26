/**
 * useWebSocketConnection Hook - Phase 1
 * Hook untuk memantau status koneksi WebSocket.
 * Menggunakan wsClient dari services.
 */

import { useEffect, useState } from "react";
import { wsClient } from "../services/websocket_client";

export function useWebSocketConnection(): {
  isConnected: boolean;
} {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Mulai koneksi saat hook pertama kali dipasang
    wsClient.connect();

    // Subscribe perubahan status
    const unsubscribe = wsClient.onStatusChange((connected) => {
      setIsConnected(connected);
    });

    // Cleanup saat unmount
    return () => {
      unsubscribe();
      wsClient.disconnect();
    };
  }, []);

  return { isConnected };
}
