// frontend/src/store/chat_state_store.ts

type Role = "user" | "assistant";

export type Message = {
  id: string;
  role: Role;
  content: string;
  timestamp?: number;   // ← baru, waktu Unix (ms)
};

export type ChatState = {
  messages: Message[];
  isLoading: boolean;
  streamingAiId: string | null;
  currentInput: string;
};

type Listener = () => void;

const STORAGE_KEY = "hydra_chat_state";

class ChatStore {
  private state: ChatState = this.loadState();

  private listeners: Listener[] = [];

  private loadState(): ChatState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);

        return {
          messages: parsed.messages || [],
          isLoading: false,
          streamingAiId: null,
          currentInput: parsed.currentInput || "",
        };
      }
    } catch {}

    return {
      messages: [],
      isLoading: false,
      streamingAiId: null,
      currentInput: "",
    };
  }

  private saveState() {
    try {
      const toSave = {
        messages: this.state.messages,
        currentInput: this.state.currentInput,
      };

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(toSave)
      );
    } catch {}
  }

  getState(): ChatState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter(
        (l) => l !== listener
      );
    };
  }

  private emit() {
    this.listeners.forEach((listener) =>
      listener()
    );

    this.saveState();
  }

  addMessage(message: Message) {
    // Jika pesan user, tambahkan timestamp jika belum ada
    const withTimestamp = {
      ...message,
      timestamp: message.timestamp ?? (message.role === 'user' ? Date.now() : undefined),
    };
    this.state = {
      ...this.state,
      messages: [...this.state.messages, withTimestamp],
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
      currentInput: "",
    };

    this.emit();
  }

  updateMessageContent(
    id: string,
    content: string
  ) {
    this.state = {
      ...this.state,
      messages: this.state.messages.map((msg) =>
        msg.id === id
          ? {
              ...msg,
              content,
            }
          : msg
      ),
    };

    this.emit();
  }

  removeFrom(id: string) {
    const index = this.state.messages.findIndex(
      (m) => m.id === id
    );

    if (index === -1) return;

    this.state = {
      ...this.state,
      messages: this.state.messages.slice(
        0,
        index
      ),
    };

    this.emit();
  }

  deleteMessage(id: string) {
    this.state = {
      ...this.state,
      messages: this.state.messages.filter(
        (m) => m.id !== id
      ),
    };

    this.emit();
  }

  removeMessage(id: string) {
    this.state = {
      ...this.state,
      messages: this.state.messages.filter(
        (m) => m.id !== id
      ),
    };

    this.emit();
  }

  deleteMessages(ids: string[]) {
    const idSet = new Set(ids);

    this.state = {
      ...this.state,
      messages: this.state.messages.filter(
        (m) => !idSet.has(m.id)
      ),
    };

    this.emit();
  }

  cleanupStoppedConversations() {
    const messages = this.state.messages;

    const cleaned: typeof messages = [];

    let temporaryBlock = false;

    for (let i = 0; i < messages.length; i++) {
      const current = messages[i];
      const next = messages[i + 1];

      if (current.role === "user") {
        const hasStoppedAhead = messages
          .slice(i + 1)
          .some((m) =>
            m.id.endsWith("_stopped")
          );

        if (hasStoppedAhead) {
          temporaryBlock = true;
          continue;
        }
      }

      if (
        current.role === "assistant" &&
        next?.id.endsWith("_stopped")
      ) {
        continue;
      }

      if (
        current.id.endsWith("_stopped")
      ) {
        temporaryBlock = false;
        continue;
      }

      if (temporaryBlock) {
        continue;
      }

      cleaned.push(current);
    }

    this.state = {
      ...this.state,
      messages: cleaned,
    };

    this.emit();
  }

  setStreamingAiId(id: string | null) {
    this.state = {
      ...this.state,
      streamingAiId: id,
    };

    this.emit();
  }

  setCurrentInput(text: string) {
    this.state = {
      ...this.state,
      currentInput: text,
    };

    this.emit();
  }
}

export const chatStore = new ChatStore();
