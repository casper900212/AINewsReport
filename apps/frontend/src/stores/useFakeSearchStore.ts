import { create } from 'zustand';

export interface Message {
  role: 'user' | 'bot';
  content: string;
}

export interface SearchRecord {
  id: string;
  query: string;
  category: string;
  source: string;
  startDate: string;
  endDate: string;
  limit: string;
  messages: Message[];
}

interface FakeSearchStore {
  records: SearchRecord[];
  getRecordById: (id: string) => SearchRecord | undefined;
  addPromptToRecord: (id: string, messages: Message | Message[]) => void;
  addRecord: (record: Omit<SearchRecord, 'messages'>) => void;
  deleteRecordById: (id: string) => void;
}

const LOCAL_STORAGE_KEY = 'searchRecords';

function loadInitialState(): SearchRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const useFakeSearchStore = create<FakeSearchStore>((set, get) => ({
  records: loadInitialState(),

  getRecordById: (id) => get().records.find((r) => r.id === id),

  addPromptToRecord: (id, messages) =>
    set((state) => {
      const newMessages = Array.isArray(messages) ? messages : [messages];
      const updatedRecords = state.records.map((r) =>
        r.id === id ? { ...r, messages: [...r.messages, ...newMessages] } : r
      );
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedRecords));
      return { records: updatedRecords };
    }),

  addRecord: (newRecord) => {
    const summaryMessage: Message = {
      role: 'user',
      content: `查詢條件如下：
關鍵字：${newRecord.query}
類別：${newRecord.category}
來源：${newRecord.source}
區間：${newRecord.startDate} ~ ${newRecord.endDate}
筆數：${newRecord.limit}`,
    };

    set((state) => {
      const updated = [
        ...state.records,
        { ...newRecord, messages: [summaryMessage] },
      ];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return { records: updated };
    });
  },

  deleteRecordById: (id) =>
    set((state) => {
      const updatedRecords = state.records.filter((r) => r.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedRecords));
      return { records: updatedRecords };
    }),
}));
