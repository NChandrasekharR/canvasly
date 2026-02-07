import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { BoardItem, BoardItemType, BoardItemData } from '../types';

interface BoardState {
  items: BoardItem[];
  addItem: (
    type: BoardItemType,
    data: BoardItemData,
    position: { x: number; y: number },
    size?: { width: number; height: number }
  ) => void;
  removeItem: (id: string) => void;
  updateItemPosition: (id: string, position: { x: number; y: number }) => void;
  updateItemSize: (id: string, size: { width: number; height: number }) => void;
  updateItemData: (id: string, data: Partial<BoardItemData>) => void;
}

const DEFAULT_SIZES: Record<BoardItemType, { width: number; height: number }> = {
  'video-embed': { width: 400, height: 280 },
  'video-upload': { width: 400, height: 280 },
  image: { width: 300, height: 250 },
  lottie: { width: 300, height: 300 },
  rive: { width: 300, height: 300 },
  code: { width: 500, height: 400 },
  text: { width: 250, height: 150 },
  color: { width: 150, height: 150 },
};

export const useBoardStore = create<BoardState>((set) => ({
  items: [],

  addItem: (type, data, position, size) =>
    set((state) => ({
      items: [
        ...state.items,
        {
          id: uuidv4(),
          type,
          position,
          size: size ?? DEFAULT_SIZES[type],
          zIndex: state.items.length,
          tags: [],
          createdAt: new Date(),
          data,
        },
      ],
    })),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  updateItemPosition: (id, position) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, position } : item
      ),
    })),

  updateItemSize: (id, size) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, size } : item
      ),
    })),

  updateItemData: (id, data) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, data: { ...item.data, ...data } } : item
      ),
    })),
}));
