/**
 * WebSocket Client - Phase 1
 * Client WebSocket dasar untuk komunikasi real-time dengan backend.
 * Di Phase 1 digunakan untuk indikator koneksi dan persiapan streaming.
 */

type MessageHandler = (data: unknown) => void;
type StatusHandler = (connected: boolean) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();

  constructor(url: string = "ws://localhost:3000/ws") {
    this.url = url;
  }

  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectDelay = 1000; // Reset reconnect delay
        this.notifyStatus(true);
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyMessage(data);
        } catch {
          // Bukan JSON, abaikan
        }
      };

      this.ws.onclose = () => {
        this.notifyStatus(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        // onclose akan dipanggil setelah ini
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null; // Hindari reconnect
      this.ws.close();
      this.ws = null;
    }
    this.notifyStatus(false);
  }

  send(data: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.maxReconnectDelay
      );
      this.connect();
    }, this.reconnectDelay);
  }

  private notifyMessage(data: unknown): void {
    this.messageHandlers.forEach((fn) => fn(data));
  }

  private notifyStatus(connected: boolean): void {
    this.statusHandlers.forEach((fn) => fn(connected));
  }
}

export const wsClient = new WebSocketClient();
