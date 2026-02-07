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
  removeItems: (ids: string[]) => void;
  updateItemPosition: (id: string, position: { x: number; y: number }) => void;
  updateItemSize: (id: string, size: { width: number; height: number }) => void;
  updateItemData: (id: string, data: Partial<BoardItemData>) => void;

  // Tags
  updateItemTags: (id: string, tags: string[]) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  tagFilter: string | null;
  setTagFilter: (tag: string | null) => void;
  getAllTags: () => string[];

  // Z-index
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;

  // Grouping
  groupItems: (itemIds: string[], label?: string) => void;
  ungroupItems: (groupId: string) => void;

  // Undo/Redo
  _undoStack: BoardItem[][];
  _redoStack: BoardItem[][];
  _pushUndoState: () => void;
  undo: () => void;
  redo: () => void;

  // Duplicate
  duplicateItems: (ids: string[]) => void;

  // Storage
  storageUsage: number;
  refreshStorageUsage: () => Promise<void>;

  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

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
      _undoStack: [],
      _redoStack: [],
    });
  },

  // Items
  items: [],
  groups: [],

  addItem: (type, data, position, size) => {
    get()._pushUndoState();
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
    get()._pushUndoState();
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
    get()._scheduleSave();
  },

  removeItems: (ids) => {
    get()._pushUndoState();
    const idSet = new Set(ids);
    set((state) => ({
      items: state.items.filter((item) => !idSet.has(item.id)),
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

  // Tags
  updateItemTags: (id, tags) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, tags } : item
      ),
    }));
    get()._scheduleSave();
  },

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  tagFilter: null,
  setTagFilter: (tag) => set({ tagFilter: tag }),

  getAllTags: () => {
    const tags = new Set<string>();
    for (const item of get().items) {
      for (const tag of item.tags) {
        tags.add(tag);
      }
    }
    return Array.from(tags).sort();
  },

  // Z-index
  bringToFront: (id) => {
    set((state) => {
      const maxZ = Math.max(...state.items.map((i) => i.zIndex), 0);
      return {
        items: state.items.map((item) =>
          item.id === id ? { ...item, zIndex: maxZ + 1 } : item
        ),
      };
    });
    get()._scheduleSave();
  },

  sendToBack: (id) => {
    set((state) => {
      const minZ = Math.min(...state.items.map((i) => i.zIndex), 0);
      return {
        items: state.items.map((item) =>
          item.id === id ? { ...item, zIndex: minZ - 1 } : item
        ),
      };
    });
    get()._scheduleSave();
  },

  // Grouping
  groupItems: (itemIds, label) => {
    const groupId = uuidv4();
    set((state) => ({
      groups: [
        ...state.groups,
        { id: groupId, label, itemIds, collapsed: false },
      ],
      items: state.items.map((item) =>
        itemIds.includes(item.id) ? { ...item, groupId } : item
      ),
    }));
    get()._scheduleSave();
  },

  ungroupItems: (groupId) => {
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== groupId),
      items: state.items.map((item) =>
        item.groupId === groupId ? { ...item, groupId: undefined } : item
      ),
    }));
    get()._scheduleSave();
  },

  // Undo/Redo
  _undoStack: [],
  _redoStack: [],

  _pushUndoState: () => {
    const { items, _undoStack } = get();
    const stack = [..._undoStack, items].slice(-50); // Keep last 50 states
    set({ _undoStack: stack, _redoStack: [] });
  },

  undo: () => {
    const { _undoStack, items } = get();
    if (_undoStack.length === 0) return;
    const prev = _undoStack[_undoStack.length - 1];
    set({
      _undoStack: _undoStack.slice(0, -1),
      _redoStack: [...get()._redoStack, items],
      items: prev,
    });
    get()._scheduleSave();
  },

  redo: () => {
    const { _redoStack, items } = get();
    if (_redoStack.length === 0) return;
    const next = _redoStack[_redoStack.length - 1];
    set({
      _redoStack: _redoStack.slice(0, -1),
      _undoStack: [...get()._undoStack, items],
      items: next,
    });
    get()._scheduleSave();
  },

  // Duplicate
  duplicateItems: (ids) => {
    get()._pushUndoState();
    set((state) => {
      const newItems = state.items
        .filter((item) => ids.includes(item.id))
        .map((item) => ({
          ...item,
          id: uuidv4(),
          position: { x: item.position.x + 30, y: item.position.y + 30 },
          createdAt: new Date(),
        }));
      return { items: [...state.items, ...newItems] };
    });
    get()._scheduleSave();
  },

  // Storage
  storageUsage: 0,
  refreshStorageUsage: async () => {
    const usage = await getStorageUsage();
    set({ storageUsage: usage });
  },

  // Theme
  theme: 'dark' as 'dark' | 'light',
  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: newTheme });
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('motionboard-theme', newTheme);
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
