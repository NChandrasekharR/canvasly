import JSZip from 'jszip';
import { db } from '../db/database';
import { getBoard, createBoard, saveBoard, saveMedia } from '../db/boardRepository';
import type { BoardItem, Group } from '../types';

interface MotionBoardManifest {
  version: 1;
  name: string;
  createdAt: string;
  updatedAt: string;
  viewport: { x: number; y: number; zoom: number };
  items: BoardItem[];
  groups: Group[];
  mediaFiles: { id: string; fileName: string; mimeType: string }[];
}

export async function exportBoard(boardId: string): Promise<Blob> {
  const board = await getBoard(boardId);
  if (!board) throw new Error('Board not found');

  const zip = new JSZip();

  // Collect media references
  const mediaRefs: { id: string; fileName: string; mimeType: string }[] = [];
  const mediaItems = await db.media.where('boardId').equals(boardId).toArray();

  for (const media of mediaItems) {
    mediaRefs.push({
      id: media.id,
      fileName: media.fileName,
      mimeType: media.mimeType,
    });
    zip.file(`media/${media.id}`, media.blob);
  }

  // Create manifest
  const manifest: MotionBoardManifest = {
    version: 1,
    name: board.name,
    createdAt: board.createdAt.toISOString(),
    updatedAt: board.updatedAt.toISOString(),
    viewport: board.viewport,
    items: board.items,
    groups: board.groups,
    mediaFiles: mediaRefs,
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  return zip.generateAsync({ type: 'blob' });
}

export async function importBoard(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file);

  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) throw new Error('Invalid .motionboard file: missing manifest');

  const manifestJson = await manifestFile.async('string');
  const manifest: MotionBoardManifest = JSON.parse(manifestJson);

  // Create a new board
  const boardId = await createBoard(manifest.name);

  // Import media files and build old->new ID mapping
  const mediaIdMap = new Map<string, string>();
  for (const mediaRef of manifest.mediaFiles) {
    const mediaFile = zip.file(`media/${mediaRef.id}`);
    if (mediaFile) {
      const blob = await mediaFile.async('blob');
      const newId = await saveMedia(boardId, blob, mediaRef.fileName, mediaRef.mimeType);
      mediaIdMap.set(mediaRef.id, newId);
    }
  }

  // Remap media IDs in items
  const items = manifest.items.map((item) => {
    const data = { ...item.data };
    if ('blobId' in data && typeof data.blobId === 'string') {
      const newId = mediaIdMap.get(data.blobId);
      if (newId) {
        (data as Record<string, unknown>).blobId = newId;
      }
    }
    return { ...item, data };
  });

  await saveBoard(boardId, {
    items,
    groups: manifest.groups,
    viewport: manifest.viewport,
    name: manifest.name,
  });

  return boardId;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
