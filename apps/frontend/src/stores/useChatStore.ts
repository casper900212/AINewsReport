// src/stores/useChatStore.ts
import { create } from "zustand";

export interface ChatMessage {
  role: "user" | "bot";
  content: string;
}

interface ChatStore {
  conversations: Record<string, ChatMessage[]>; // key: historyId
  addMessage: (historyId: string, message: ChatMessage) => void;
  getMessages: (historyId: string) => ChatMessage[];
  resetMessages: (historyId: string) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: {},

  addMessage: (historyId, message) =>
    set((state) => {
      const prev = state.conversations[historyId] || [];
      return {
        conversations: {
          ...state.conversations,
          [historyId]: [...prev, message],
        },
      };
    }),

  getMessages: (historyId) => get().conversations[historyId] || [],

  resetMessages: (historyId) =>
    set((state) => ({
      conversations: {
        ...state.conversations,
        [historyId]: [],
      },
    })),
}));
