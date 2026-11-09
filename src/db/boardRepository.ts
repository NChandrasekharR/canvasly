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
  // Date.toJSON runs before a replacer sees the value, so check the original
  // property. Otherwise createdAt is stored as a bare ISO string and comes
  // back as a string instead of a Date.
  return JSON.stringify(items, function (key, value) {
    const original = this[key];
    if (original instanceof Date) return { __date: original.toISOString() };
    return value;
  });
}

function reviveDate(value: unknown): Date | undefined {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  if (value && typeof value === 'object' && '__date' in value) {
    const date = new Date((value as { __date: unknown }).__date as string);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return undefined;
}

function deserializeItems(json: string): BoardItem[] {
  const items = JSON.parse(json, (_key, value) => {
    if (value && typeof value === 'object' && '__date' in value && !Array.isArray(value)) {
      const date = reviveDate(value);
      return date ?? value;
    }
    return value;
  }) as BoardItem[];
  return items.map((item) => ({
    ...item,
    tags: Array.isArray(item.tags) ? item.tags : [],
    createdAt: reviveDate(item.createdAt) ?? new Date(0),
  }));
}

export async function listBoards(): Promise<BoardMeta[]> {
  const boards = await db.boards.orderBy('updatedAt').reverse().toArray();
  return boards.map((b) => ({
    id: b.id,
    name: b.name,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    itemCount: b.itemCount ?? 0,
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

  // Calculate approximate storage size and item count
  update.storageSize = new Blob([update.items!]).size;
  update.itemCount = data.items.length;

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
  const mediaItems = await db.media.where('boardId').equals(id).toArray();
  const idMap = new Map<string, string>();
  const copiedMedia = mediaItems.map((media) => {
    const mediaId = uuidv4();
    idMap.set(media.id, mediaId);
    return { ...media, id: mediaId, boardId: newId };
  });

  // Items must point at the copy's blobs. Leaving the original ids makes the
  // duplicate look fine until orphan cleanup, or a delete on the source board,
  // removes the only bytes those items can still load.
  const items = deserializeItems(board.items).map((item) => {
    const blobId = (item.data as { blobId?: unknown }).blobId;
    if (typeof blobId !== 'string' || !idMap.has(blobId)) return item;
    return { ...item, data: { ...item.data, blobId: idMap.get(blobId) } };
  });
  const serializedItems = serializeItems(items);

  await db.transaction('rw', [db.boards, db.media], async () => {
    await db.boards.add({
      ...board,
      id: newId,
      name: `${board.name} (copy)`,
      createdAt: now,
      updatedAt: now,
      items: serializedItems,
      itemCount: items.length,
      storageSize: new Blob([serializedItems]).size,
    });
    if (copiedMedia.length > 0) {
      await db.media.bulkAdd(copiedMedia);
    }
  });

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

/**
 * Delete media blobs for a board that no item references anymore.
 * Safe to run at board-open time, when the undo stack is empty —
 * during a session, deleted items may still be restored via undo,
 * so their blobs must not be collected until the next open.
 */
export async function cleanupOrphanedMedia(boardId: string, items: BoardItem[]): Promise<number> {
  const referenced = new Set<string>();
  for (const item of items) {
    const data = item.data as Record<string, unknown>;
    if (typeof data.blobId === 'string') referenced.add(data.blobId);
  }
  const media = await db.media.where('boardId').equals(boardId).toArray();
  const orphans = media.filter((m) => !referenced.has(m.id)).map((m) => m.id);
  if (orphans.length > 0) {
    await db.media.bulkDelete(orphans);
  }
  return orphans.length;
}

export async function getStorageUsage(): Promise<number> {
  const boards = await db.boards.toArray();
  const media = await db.media.toArray();
  let total = 0;
  for (const b of boards) total += new Blob([b.items]).size;
  for (const m of media) total += m.size;
  return total;
}
