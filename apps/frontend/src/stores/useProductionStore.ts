import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProductionRecord {
  id: string;
  keyword: string;
  category: string;
  source: string;
  dateRange: string;
  limit: number;
  createdAt: string;
}

interface ProductionStore {
  records: ProductionRecord[];
  addProductionRecord: (record: ProductionRecord) => void;
  deleteProductionRecord: (id: string) => void;
}

// ✅ 使用 persist middleware 將資料儲存到 localStorage
export const useProductionStore = create<ProductionStore>()(
  persist(
    (set) => ({
      records: [],
      addProductionRecord: (record) =>
        set((state) => ({
          records: [...state.records, record],
        })),
      deleteProductionRecord: (id) =>
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        })),
    }),
    {
      name: "production-storage", // localStorage 的 key 名
    }
  )
);
