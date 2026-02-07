import Dexie, { type EntityTable } from 'dexie';

export interface DBBoard {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  viewport: { x: number; y: number; zoom: number };
  items: string; // JSON-serialized BoardItem[]
  groups: string; // JSON-serialized Group[]
  thumbnail?: Blob;
  storageSize?: number;
}

export interface DBMedia {
  id: string;
  boardId: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
  size: number;
}

class MotionBoardDB extends Dexie {
  boards!: EntityTable<DBBoard, 'id'>;
  media!: EntityTable<DBMedia, 'id'>;

  constructor() {
    super('motionboard');
    this.version(1).stores({
      boards: 'id, name, updatedAt',
      media: 'id, boardId',
    });
  }
}

export const db = new MotionBoardDB();
