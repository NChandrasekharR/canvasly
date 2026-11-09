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
  cleanupOrphanedMedia,
  type BoardMeta,
} from '../db/boardRepository';

type View = 'home' | 'canvas';

interface UndoSnapshot {
  items: BoardItem[];
  groups: Group[];
}

// Module-level save state (avoids polluting Zustand state and triggering re-renders).
// Saves are queued so a slow write cannot land after a newer one, and each write
// is pinned to the board id captured when it was scheduled.
let _saveTimeout: ReturnType<typeof setTimeout> | null = null;
let _saveTail: Promise<void> = Promise.resolve();

interface SavePayload {
  items: BoardItem[];
  groups: Group[];
  viewport: { x: number; y: number; zoom: number };
}

function cancelScheduledSave() {
  if (_saveTimeout) {
    clearTimeout(_saveTimeout);
    _saveTimeout = null;
  }
}

function enqueueSave(boardId: string, data: SavePayload): Promise<void> {
  const run = _saveTail.then(() => saveBoard(boardId, data));
  _saveTail = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function flushBoardSnapshot(boardId: string, data: SavePayload): Promise<void> {
  cancelScheduledSave();
  try {
    await enqueueSave(boardId, data);
  } catch (err) {
    console.error('[MotionBoard] Save failed', err);
  }
}

function withoutItems(items: BoardItem[], groups: Group[], ids: Set<string>) {
  return {
    items: items.filter((item) => !ids.has(item.id)),
    groups: groups
      .map((group) => ({
        ...group,
        itemIds: group.itemIds.filter((id) => !ids.has(id)),
      }))
      .filter((group) => group.itemIds.length > 0),
  };
}

// Restore persisted theme before first render so the UI doesn't flash dark
const initialTheme: 'dark' | 'light' =
  localStorage.getItem('motionboard-theme') === 'light' ? 'light' : 'dark';
document.documentElement.setAttribute('data-theme', initialTheme);

interface BoardState {
  // Navigation
  view: View;
  setView: (view: View) => void;
  flushActiveBoard: () => Promise<void>;

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
  ) => string;
  removeItem: (id: string) => void;
  removeItems: (ids: string[]) => void;
  updateItemPosition: (id: string, position: { x: number; y: number }) => void;
  updateItemPositions: (updates: { id: string; position: { x: number; y: number } }[]) => void;
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
  _undoStack: UndoSnapshot[];
  _redoStack: UndoSnapshot[];
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

  // Viewport (persisted per board)
  _viewport: { x: number; y: number; zoom: number };
  updateViewport: (viewport: { x: number; y: number; zoom: number }) => void;

  // Auto-save
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
  setView: (view) => {
    if (view !== 'home') {
      set({ view });
      return;
    }
    const snapshot = get();
    void (async () => {
      if (snapshot.view === 'canvas' && snapshot.activeBoardId) {
        await flushBoardSnapshot(snapshot.activeBoardId, {
          items: snapshot.items,
          groups: snapshot.groups,
          viewport: snapshot._viewport,
        });
        const latest = get();
        if (
          latest.view === 'canvas' &&
          latest.activeBoardId === snapshot.activeBoardId &&
          (latest.items !== snapshot.items ||
            latest.groups !== snapshot.groups ||
            latest._viewport !== snapshot._viewport)
        ) {
          await flushBoardSnapshot(latest.activeBoardId, {
            items: latest.items,
            groups: latest.groups,
            viewport: latest._viewport,
          });
        }
      }
      if (get().view === 'canvas' && get().activeBoardId === snapshot.activeBoardId) {
        set({ view: 'home', searchQuery: '', tagFilter: null });
        await get().loadBoards();
      } else if (!snapshot.activeBoardId) {
        set({ view: 'home', searchQuery: '', tagFilter: null });
      }
    })();
  },

  flushActiveBoard: async () => {
    const state = get();
    if (state.view !== 'canvas' || !state.activeBoardId) return;
    await flushBoardSnapshot(state.activeBoardId, {
      items: state.items,
      groups: state.groups,
      viewport: state._viewport,
    });
    const latest = get();
    if (
      latest.view === 'canvas' &&
      latest.activeBoardId === state.activeBoardId &&
      (latest.items !== state.items || latest.groups !== state.groups || latest._viewport !== state._viewport)
    ) {
      await flushBoardSnapshot(latest.activeBoardId, {
        items: latest.items,
        groups: latest.groups,
        viewport: latest._viewport,
      });
    }
  },

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
    if (get().activeBoardId === id) cancelScheduledSave();
    await deleteBoardDB(id);
    await get().loadBoards();
    if (get().activeBoardId === id) {
      set({ activeBoardId: null, items: [], groups: [], view: 'home', searchQuery: '', tagFilter: null });
    }
  },

  duplicateBoard: async (id) => {
    if (get().activeBoardId === id && get().view === 'canvas') {
      await get().flushActiveBoard();
    }
    await duplicateBoardDB(id);
    await get().loadBoards();
  },

  // Active board
  activeBoardId: null,
  activeBoardName: 'Untitled Board',

  openBoard: async (id) => {
    const current = get();
    if (current.view === 'canvas' && current.activeBoardId === id) return;
    if (current.view === 'canvas' && current.activeBoardId) {
      await get().flushActiveBoard();
    }
    const board = await getBoard(id);
    if (!board) return;
    set({
      activeBoardId: board.id,
      activeBoardName: board.name,
      items: board.items,
      groups: board.groups,
      _viewport: board.viewport,
      view: 'canvas',
      _undoStack: [],
      _redoStack: [],
      searchQuery: '',
      tagFilter: null,
    });
    // Undo stack is empty here, so unreferenced blobs can't be restored — safe to collect
    cleanupOrphanedMedia(board.id, board.items)
      .then((n) => {
        if (n > 0) get().refreshStorageUsage();
      })
      .catch(() => {});
  },

  // Items
  items: [],
  groups: [],

  addItem: (type, data, position, size) => {
    const itemId = uuidv4();
    const resolvedSize = size ?? DEFAULT_SIZES[type];
    get()._pushUndoState();
    set((state) => ({
      items: [
        ...state.items,
        {
          id: itemId,
          type,
          position,
          size: resolvedSize,
          zIndex: state.items.length,
          tags: [],
          createdAt: new Date(),
          data,
        },
      ],
    }));
    get()._scheduleSave();
    return itemId;
  },

  removeItem: (id) => {
    get().removeItems([id]);
  },

  removeItems: (ids) => {
    if (ids.length === 0) return;
    get()._pushUndoState();
    const idSet = new Set(ids);
    set((state) => withoutItems(state.items, state.groups, idSet));
    get()._scheduleSave();
  },

  updateItemPosition: (id, position) => {
    const current = get().items.find((item) => item.id === id);
    if (current && current.position.x === position.x && current.position.y === position.y) return;
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, position } : item
      ),
    }));
    get()._scheduleSave();
  },

  // Batched position update — one undo entry per drag gesture, even multi-select
  updateItemPositions: (updates) => {
    const current = get().items;
    const changed = updates.filter((update) => {
      const item = current.find((candidate) => candidate.id === update.id);
      return !!item && (item.position.x !== update.position.x || item.position.y !== update.position.y);
    });
    if (changed.length === 0) return;
    get()._pushUndoState();
    updates = changed;
    const posMap = new Map(updates.map((u) => [u.id, u.position]));
    set((state) => ({
      items: state.items.map((item) => {
        const position = posMap.get(item.id);
        return position ? { ...item, position } : item;
      }),
    }));
    get()._scheduleSave();
  },

  updateItemSize: (id, size) => {
    const current = get().items.find((item) => item.id === id);
    if (current && current.size.width === size.width && current.size.height === size.height) return;
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
    const uniqueIds = [...new Set(itemIds)];
    if (uniqueIds.length < 2) return;
    const groupId = uuidv4();
    get()._pushUndoState();
    set((state) => ({
      groups: [
        ...state.groups
          .map((group) => ({
            ...group,
            itemIds: group.itemIds.filter((id) => !uniqueIds.includes(id)),
          }))
          .filter((group) => group.itemIds.length > 0),
        { id: groupId, label, itemIds: uniqueIds, collapsed: false },
      ],
      items: state.items.map((item) =>
        uniqueIds.includes(item.id) ? { ...item, groupId } : item
      ),
    }));
    get()._scheduleSave();
  },

  ungroupItems: (groupId) => {
    get()._pushUndoState();
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== groupId),
      items: state.items.map((item) =>
        item.groupId === groupId ? { ...item, groupId: undefined } : item
      ),
    }));
    get()._scheduleSave();
  },

  // Undo/Redo — snapshots include both items and groups
  _undoStack: [],
  _redoStack: [],

  _pushUndoState: () => {
    const { items, groups, _undoStack } = get();
    const stack = [..._undoStack, { items, groups }].slice(-50);
    set({ _undoStack: stack, _redoStack: [] });
  },

  undo: () => {
    const { _undoStack, items, groups } = get();
    if (_undoStack.length === 0) return;
    const prev = _undoStack[_undoStack.length - 1];
    set({
      _undoStack: _undoStack.slice(0, -1),
      _redoStack: [...get()._redoStack, { items, groups }],
      items: prev.items,
      groups: prev.groups,
    });
    get()._scheduleSave();
  },

  redo: () => {
    const { _redoStack, items, groups } = get();
    if (_redoStack.length === 0) return;
    const next = _redoStack[_redoStack.length - 1];
    set({
      _redoStack: _redoStack.slice(0, -1),
      _undoStack: [...get()._undoStack, { items, groups }],
      items: next.items,
      groups: next.groups,
    });
    get()._scheduleSave();
  },

  // Duplicate
  duplicateItems: (ids) => {
    get()._pushUndoState();
    set((state) => {
      const maxZ = Math.max(0, ...state.items.map((item) => item.zIndex));
      const newItems = state.items
        .filter((item) => ids.includes(item.id))
        .map((item, index) => ({
          ...item,
          id: uuidv4(),
          position: { x: item.position.x + 30, y: item.position.y + 30 },
          createdAt: new Date(),
          groupId: undefined,
          zIndex: maxZ + 1 + index,
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
  theme: initialTheme,
  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: newTheme });
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('motionboard-theme', newTheme);
  },

  // Viewport
  _viewport: { x: 0, y: 0, zoom: 1 },
  updateViewport: (viewport) => {
    set({ _viewport: viewport });
    get()._scheduleSave();
  },

  // Auto-save (debounced 500ms). The board id is read when the timer fires,
  // and navigation flushes the current board before that id can change.
  _scheduleSave: () => {
    cancelScheduledSave();
    _saveTimeout = setTimeout(() => {
      _saveTimeout = null;
      const latest = get();
      if (!latest.activeBoardId || latest.view !== 'canvas') return;
      const boardId = latest.activeBoardId;
      void enqueueSave(boardId, {
        items: latest.items,
        groups: latest.groups,
        viewport: latest._viewport,
      })
        .then(() => {
          if (get().activeBoardId === boardId) return get().refreshStorageUsage();
        })
        .catch((err) => console.error('[MotionBoard] Save failed', err));
    }, 500);
  },
}));
