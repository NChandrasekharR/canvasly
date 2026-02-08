import { memo, useEffect, useState } from 'react';
import { type NodeProps, NodeResizer } from '@xyflow/react';
import { useBoardStore } from '../store/boardStore';
import { ImageCard } from './cards/ImageCard';
import { GifCard } from './cards/GifCard';
import { VideoEmbedCard } from './cards/VideoEmbedCard';
import { VideoUploadCard } from './cards/VideoUploadCard';
import { LottieCard } from './cards/LottieCard';
import { RiveCard } from './cards/RiveCard';
import { TextCard } from './cards/TextCard';
import { ColorCard } from './cards/ColorCard';
import { CodeCard } from './cards/CodeCard';
import { getMedia } from '../db/boardRepository';
import type {
  BoardItem,
  ImageItemData,
  VideoEmbedData,
  VideoUploadData,
  LottieData,
  RiveData,
  TextData,
  ColorData,
  CodeData,
} from '../types';

type BoardNodeData = {
  boardItem: BoardItem;
  [key: string]: unknown;
};

function BoardNodeInner({ data, selected }: NodeProps) {
  const nodeData = data as unknown as BoardNodeData;
  const item = nodeData.boardItem;
  console.log('[Canvasly] BoardNode render', { id: item.id, type: item.type, position: item.position, size: item.size });
  const updateItemSize = useBoardStore((s) => s.updateItemSize);
  const searchQuery = useBoardStore((s) => s.searchQuery);
  const tagFilter = useBoardStore((s) => s.tagFilter);
  const [blobUrl, setBlobUrl] = useState<string | undefined>();

  useEffect(() => {
    let revoke: string | undefined;
    const loadBlob = async () => {
      let blobId: string | undefined;
      if (item.type === 'video-upload') {
        blobId = (item.data as VideoUploadData).blobId;
      } else if (item.type === 'rive') {
        blobId = (item.data as RiveData).blobId;
      }
      if (blobId) {
        const media = await getMedia(blobId);
        if (media) {
          const url = URL.createObjectURL(media.blob);
          revoke = url;
          setBlobUrl(url);
        }
      }
    };
    loadBlob();
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [item.type, item.data]);

  // Filter: dim items that don't match tag filter or search
  const matchesFilter = (() => {
    if (tagFilter && !item.tags.includes(tagFilter)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const searchable = [
        ...item.tags,
        item.type,
        ...(item.data && 'fileName' in item.data ? [String(item.data.fileName)] : []),
        ...(item.data && 'url' in item.data ? [String(item.data.url)] : []),
        ...(item.data && 'title' in item.data ? [String(item.data.title)] : []),
        ...(item.data && 'content' in item.data ? [String(item.data.content)] : []),
        ...(item.data && 'label' in item.data ? [String(item.data.label)] : []),
      ].join(' ').toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    return true;
  })();

  const renderCard = () => {
    switch (item.type) {
      case 'image': {
        const imgData = item.data as ImageItemData;
        const isGif = imgData.fileName?.toLowerCase().endsWith('.gif');
        if (isGif) {
          return <GifCard id={item.id} data={imgData} width={item.size.width} height={item.size.height} />;
        }
        return <ImageCard id={item.id} data={imgData} width={item.size.width} height={item.size.height} />;
      }
      case 'video-embed':
        return <VideoEmbedCard id={item.id} data={item.data as VideoEmbedData} width={item.size.width} height={item.size.height} />;
      case 'video-upload':
        return <VideoUploadCard id={item.id} data={item.data as VideoUploadData} width={item.size.width} height={item.size.height} blobUrl={blobUrl} />;
      case 'lottie':
        return <LottieCard id={item.id} data={item.data as LottieData} width={item.size.width} height={item.size.height} />;
      case 'rive':
        return <RiveCard id={item.id} data={item.data as RiveData} width={item.size.width} height={item.size.height} blobUrl={blobUrl} />;
      case 'text':
        return <TextCard id={item.id} data={item.data as TextData} width={item.size.width} height={item.size.height} />;
      case 'color':
        return <ColorCard id={item.id} data={item.data as ColorData} width={item.size.width} height={item.size.height} />;
      case 'code':
        return <CodeCard id={item.id} data={item.data as CodeData} width={item.size.width} height={item.size.height} />;
      default:
        return (
          <div className="w-full h-full flex items-center justify-center text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            {item.type}
          </div>
        );
    }
  };

  return (
    <div
      style={{
        width: item.size.width,
        height: item.size.height,
        opacity: matchesFilter ? 1 : 0.2,
        transition: 'opacity 0.2s',
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={150}
        minHeight={100}
        lineStyle={{ borderColor: 'var(--accent)', borderWidth: 1 }}
        handleStyle={{ width: 8, height: 8, backgroundColor: 'var(--accent)', borderRadius: 2, border: 'none' }}
        onResize={(_event, params) => {
          updateItemSize(item.id, { width: params.width, height: params.height });
        }}
      />
      {renderCard()}
    </div>
  );
}

export const BoardNode = memo(BoardNodeInner);
