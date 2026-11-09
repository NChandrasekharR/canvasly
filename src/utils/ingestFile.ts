import { saveMedia } from '../db/boardRepository';
import type { BoardItemData, BoardItemType } from '../types';
import {
  getFileExtension,
  isGifFile,
  isImageFile,
  isVideoFile,
  MAX_FILE_SIZE,
  WARN_FILE_SIZE,
} from './files';
import { isLottieJson, LOTTIE_INLINE_MAX_BYTES } from './lottie';
import { getVideoDuration } from './video';

export class IngestError extends Error {
  level: 'error' | 'warning';

  constructor(message: string, level: 'error' | 'warning' = 'error') {
    super(message);
    this.name = 'IngestError';
    this.level = level;
  }
}

export interface PreparedItem {
  type: BoardItemType;
  data: BoardItemData;
  warning?: string;
}

export function stackPosition(
  origin: { x: number; y: number },
  index: number
): { x: number; y: number } {
  return { x: origin.x + index * 28, y: origin.y + index * 28 };
}

export async function prepareItemFromFile(file: File, boardId: string): Promise<PreparedItem> {
  if (file.size > MAX_FILE_SIZE) {
    throw new IngestError(`"${file.name}" exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
  }

  const warning =
    file.size > WARN_FILE_SIZE
      ? `"${file.name}" is large (${(file.size / (1024 * 1024)).toFixed(1)}MB) — may slow saving`
      : undefined;

  const ext = getFileExtension(file.name);

  if (ext === 'json') {
    let text: string;
    let parsed: unknown;
    try {
      text = await file.text();
      parsed = JSON.parse(text);
    } catch {
      throw new IngestError(`"${file.name}" is not valid JSON`);
    }
    if (!isLottieJson(parsed)) {
      throw new IngestError(`"${file.name}" is not a Lottie animation`);
    }
    if (text.length > LOTTIE_INLINE_MAX_BYTES) {
      const blob = new Blob([text], { type: 'application/json' });
      const blobId = await saveMedia(boardId, blob, file.name, 'application/json');
      return {
        type: 'lottie',
        data: { blobId, speed: 1, fileName: file.name },
        warning,
      };
    }
    return {
      type: 'lottie',
      data: { animationData: parsed, speed: 1, fileName: file.name },
      warning,
    };
  }

  if (ext === 'riv') {
    const blobId = await saveMedia(boardId, file, file.name, file.type || 'application/octet-stream');
    return {
      type: 'rive',
      data: { blobId, fileName: file.name, fileSize: file.size, speed: 1 },
      warning,
    };
  }

  if (isVideoFile(file)) {
    const duration = await getVideoDuration(file);
    const blobId = await saveMedia(boardId, file, file.name, file.type || 'video/mp4');
    return {
      type: 'video-upload',
      data: {
        blobId,
        fileName: file.name,
        mimeType: file.type || 'video/mp4',
        fileSize: file.size,
        duration,
      },
      warning,
    };
  }

  if (isGifFile(file) || isImageFile(file)) {
    const blobId = await saveMedia(boardId, file, file.name, file.type || 'image/png');
    return {
      type: 'image',
      data: { blobId, fileName: file.name },
      warning,
    };
  }

  throw new IngestError(`Unsupported file type: "${file.name}"`, 'warning');
}
