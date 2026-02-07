import { v4 as uuidv4 } from 'uuid';
import { db, type DBBoard, type DBMedia } from './database';
import type { BoardItem, Group } from '../types';

export interface BoardMeta {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
  storageSize?: number;
  thumbnail?: Blob;
}

function serializeItems(items: BoardItem[]): string {
  return JSON.stringify(items, (_key, value) => {
    if (value instanceof Date) return { __date: value.toISOString() };
    return value;
  });
}

function deserializeItems(json: string): BoardItem[] {
  return JSON.parse(json, (_key, value) => {
    if (value && typeof value === 'object' && '__date' in value) {
      return new Date(value.__date as string);
    }
    return value;
  });
}

export async function listBoards(): Promise<BoardMeta[]> {
  const boards = await db.boards.orderBy('updatedAt').reverse().toArray();
  return boards.map((b) => ({
    id: b.id,
    name: b.name,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    itemCount: JSON.parse(b.items).length,
    storageSize: b.storageSize,
    thumbnail: b.thumbnail,
  }));
}

export async function createBoard(name: string): Promise<string> {
  const id = uuidv4();
  const now = new Date();
  await db.boards.add({
    id,
    name,
    createdAt: now,
    updatedAt: now,
    viewport: { x: 0, y: 0, zoom: 1 },
    items: '[]',
    groups: '[]',
  });
  return id;
}

export async function getBoard(id: string): Promise<{
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  viewport: { x: number; y: number; zoom: number };
  items: BoardItem[];
  groups: Group[];
} | null> {
  const board = await db.boards.get(id);
  if (!board) return null;
  return {
    id: board.id,
    name: board.name,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
    viewport: board.viewport,
    items: deserializeItems(board.items),
    groups: JSON.parse(board.groups),
  };
}

export async function saveBoard(
  id: string,
  data: {
    items: BoardItem[];
    groups?: Group[];
    viewport?: { x: number; y: number; zoom: number };
    name?: string;
  }
): Promise<void> {
  const update: Partial<DBBoard> = {
    updatedAt: new Date(),
    items: serializeItems(data.items),
  };
  if (data.groups !== undefined) update.groups = JSON.stringify(data.groups);
  if (data.viewport !== undefined) update.viewport = data.viewport;
  if (data.name !== undefined) update.name = data.name;

  // Calculate approximate storage size
  update.storageSize = new Blob([update.items!]).size;

  await db.boards.update(id, update);
}

export async function renameBoard(id: string, name: string): Promise<void> {
  await db.boards.update(id, { name, updatedAt: new Date() });
}

export async function deleteBoard(id: string): Promise<void> {
  await db.transaction('rw', [db.boards, db.media], async () => {
    await db.boards.delete(id);
    await db.media.where('boardId').equals(id).delete();
  });
}

export async function duplicateBoard(id: string): Promise<string> {
  const board = await db.boards.get(id);
  if (!board) throw new Error('Board not found');

  const newId = uuidv4();
  const now = new Date();
  await db.boards.add({
    ...board,
    id: newId,
    name: `${board.name} (copy)`,
    createdAt: now,
    updatedAt: now,
  });

  // Duplicate media
  const mediaItems = await db.media.where('boardId').equals(id).toArray();
  for (const m of mediaItems) {
    await db.media.add({ ...m, id: uuidv4(), boardId: newId });
  }

  return newId;
}

// Media operations
export async function saveMedia(
  boardId: string,
  blob: Blob,
  fileName: string,
  mimeType: string
): Promise<string> {
  const id = uuidv4();
  await db.media.add({
    id,
    boardId,
    blob,
    fileName,
    mimeType,
    size: blob.size,
  });
  return id;
}

export async function getMedia(id: string): Promise<DBMedia | undefined> {
  return db.media.get(id);
}

export async function deleteMedia(id: string): Promise<void> {
  await db.media.delete(id);
}

export async function getStorageUsage(): Promise<number> {
  const boards = await db.boards.toArray();
  const media = await db.media.toArray();
  let total = 0;
  for (const b of boards) total += new Blob([b.items]).size;
  for (const m of media) total += m.size;
  return total;
}
