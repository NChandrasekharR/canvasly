import { useBoardStore } from '../store/boardStore';
import type { VideoEmbedData } from '../types';
import { fetchVideoMetadata } from './video';

/** Fill in title and thumbnail after the card is already on the board. */
export function loadVideoMetadata(
  itemId: string,
  url: string,
  platform: 'youtube' | 'vimeo'
): void {
  void fetchVideoMetadata(url, platform).then((meta) => {
    const patch: Partial<VideoEmbedData> = {};
    if (meta.title) patch.title = meta.title;
    if (meta.thumbnailUrl) patch.thumbnailUrl = meta.thumbnailUrl;
    if (Object.keys(patch).length === 0) return;
    const item = useBoardStore.getState().items.find((candidate) => candidate.id === itemId);
    if (!item || item.type !== 'video-embed') return;
    useBoardStore.getState().updateItemData(itemId, patch);
  });
}
