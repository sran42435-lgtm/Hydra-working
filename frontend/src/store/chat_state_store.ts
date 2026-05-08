type Role = "user" | "assistant";

export type Message = {
  id: string;
  role: Role;
  content: string;
};

type ChatState = {
  messages: Message[];
  isLoading: boolean;
  streamingAiId: string | null;   // ID pesan AI yang sedang streaming
};

type Listener = () => void;

class ChatStore {
  private state: ChatState = {
    messages: [],
    isLoading: false,
    streamingAiId: null,
  };

  private listeners: Listener[] = [];

  getState(): ChatState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  addMessage(message: Message) {
    this.state = {
      ...this.state,
      messages: [...this.state.messages, message],
    };
    this.emit();
  }

  setMessages(messages: Message[]) {
    this.state = { ...this.state, messages: [...messages] };
    this.emit();
  }

  setLoading(isLoading: boolean) {
    this.state = { ...this.state, isLoading };
    this.emit();
  }

  clearMessages() {
    this.state = { ...this.state, messages: [] };
    this.emit();
  }

  updateMessageContent(id: string, content: string) {
    this.state = {
      ...this.state,
      messages: this.state.messages.map((msg) =>
        msg.id === id ? { ...msg, content } : msg
      ),
    };
    this.emit();
  }

  removeFrom(id: string) {
    const index = this.state.messages.findIndex((m) => m.id === id);
    if (index === -1) return;
    this.state = {
      ...this.state,
      messages: this.state.messages.slice(0, index),
    };
    this.emit();
  }

  // ** Baru **
  setStreamingAiId(id: string | null) {
    this.state = { ...this.state, streamingAiId: id };
    this.emit();
  }
}

export const chatStore = new ChatStore();
