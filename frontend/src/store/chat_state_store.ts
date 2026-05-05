type Role = "user" | "assistant";

export type Message = {
  id: string;
  role: Role;
  content: string;
};

type ChatState = {
  messages: Message[];
  isLoading: boolean;
};

type Listener = () => void;

class ChatStore {
  private state: ChatState = {
    messages: [],
    isLoading: false,
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
    this.state = {
      ...this.state,
      messages: [...messages],
    };
    this.emit();
  }

  setLoading(isLoading: boolean) {
    this.state = {
      ...this.state,
      isLoading,
    };
    this.emit();
  }

  clearMessages() {
    this.state = {
      ...this.state,
      messages: [],
    };
    this.emit();
  }

  // NEW: update the content of a specific message by id
  updateMessageContent(id: string, content: string) {
    this.state = {
      ...this.state,
      messages: this.state.messages.map((msg) =>
        msg.id === id ? { ...msg, content } : msg
      ),
    };
    this.emit();
  }
}

export const chatStore = new ChatStore();
