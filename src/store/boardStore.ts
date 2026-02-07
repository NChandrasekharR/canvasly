import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { BoardItem, BoardItemType, BoardItemData, Group } from '../types';
import {
  listBoards,
  createBoard,
  getBoard,
  saveBoard,
  renameBoard as renameBoardDB,
  deleteBoard as deleteBoardDB,
  duplicateBoard as duplicateBoardDB,
  getStorageUsage,
  type BoardMeta,
} from '../db/boardRepository';

type View = 'home' | 'canvas';

interface BoardState {
  // Navigation
  view: View;
  setView: (view: View) => void;

  // Board list
  boards: BoardMeta[];
  loadBoards: () => Promise<void>;
  createNewBoard: (name?: string) => Promise<string>;
  renameBoard: (id: string, name: string) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  duplicateBoard: (id: string) => Promise<void>;

  // Active board
  activeBoardId: string | null;
  activeBoardName: string;
  openBoard: (id: string) => Promise<void>;

  // Items
  items: BoardItem[];
  groups: Group[];
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

  // Storage
  storageUsage: number;
  refreshStorageUsage: () => Promise<void>;

  // Auto-save
  _saveTimeout: ReturnType<typeof setTimeout> | null;
  _scheduleSave: () => void;
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

export const useBoardStore = create<BoardState>((set, get) => ({
  // Navigation
  view: 'home',
  setView: (view) => set({ view }),

  // Board list
  boards: [],
  loadBoards: async () => {
    const boards = await listBoards();
    set({ boards });
  },

  createNewBoard: async (name) => {
    const id = await createBoard(name ?? 'Untitled Board');
    await get().loadBoards();
    return id;
  },

  renameBoard: async (id, name) => {
    await renameBoardDB(id, name);
    await get().loadBoards();
    if (get().activeBoardId === id) {
      set({ activeBoardName: name });
    }
  },

  deleteBoard: async (id) => {
    await deleteBoardDB(id);
    await get().loadBoards();
    if (get().activeBoardId === id) {
      set({ activeBoardId: null, items: [], groups: [], view: 'home' });
    }
  },

  duplicateBoard: async (id) => {
    await duplicateBoardDB(id);
    await get().loadBoards();
  },

  // Active board
  activeBoardId: null,
  activeBoardName: 'Untitled Board',

  openBoard: async (id) => {
    const board = await getBoard(id);
    if (!board) return;
    set({
      activeBoardId: board.id,
      activeBoardName: board.name,
      items: board.items,
      groups: board.groups,
      view: 'canvas',
    });
  },

  // Items
  items: [],
  groups: [],

  addItem: (type, data, position, size) => {
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
    }));
    get()._scheduleSave();
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
    get()._scheduleSave();
  },

  updateItemPosition: (id, position) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, position } : item
      ),
    }));
    get()._scheduleSave();
  },

  updateItemSize: (id, size) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, size } : item
      ),
    }));
    get()._scheduleSave();
  },

  updateItemData: (id, data) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, data: { ...item.data, ...data } } : item
      ),
    }));
    get()._scheduleSave();
  },

  // Storage
  storageUsage: 0,
  refreshStorageUsage: async () => {
    const usage = await getStorageUsage();
    set({ storageUsage: usage });
  },

  // Auto-save (debounced 500ms)
  _saveTimeout: null,
  _scheduleSave: () => {
    const state = get();
    if (state._saveTimeout) clearTimeout(state._saveTimeout);
    const timeout = setTimeout(async () => {
      const { activeBoardId, items, groups } = get();
      if (!activeBoardId) return;
      await saveBoard(activeBoardId, { items, groups });
      await get().refreshStorageUsage();
    }, 500);
    set({ _saveTimeout: timeout });
  },
}));
