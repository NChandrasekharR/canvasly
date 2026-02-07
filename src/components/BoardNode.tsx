import { memo } from 'react';
import { type NodeProps, NodeResizer } from '@xyflow/react';
import { useBoardStore } from '../store/boardStore';
import { ImageCard } from './cards/ImageCard';
import { GifCard } from './cards/GifCard';
import { VideoEmbedCard } from './cards/VideoEmbedCard';
import type { BoardItem, ImageItemData, VideoEmbedData } from '../types';

type BoardNodeData = {
  boardItem: BoardItem;
  [key: string]: unknown;
};

function BoardNodeInner({ data, selected }: NodeProps) {
  const nodeData = data as unknown as BoardNodeData;
  const item = nodeData.boardItem;
  const updateItemSize = useBoardStore((s) => s.updateItemSize);

  const renderCard = () => {
    switch (item.type) {
      case 'image': {
        const imgData = item.data as ImageItemData;
        const isGif = imgData.fileName?.toLowerCase().endsWith('.gif');
        if (isGif) {
          return (
            <GifCard
              id={item.id}
              data={imgData}
              width={item.size.width}
              height={item.size.height}
            />
          );
        }
        return (
          <ImageCard
            id={item.id}
            data={imgData}
            width={item.size.width}
            height={item.size.height}
          />
        );
      }
      case 'video-embed':
        return (
          <VideoEmbedCard
            id={item.id}
            data={item.data as VideoEmbedData}
            width={item.size.width}
            height={item.size.height}
          />
        );
      default:
        return (
          <div
            className="w-full h-full flex items-center justify-center text-sm"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          >
            {item.type}
          </div>
        );
    }
  };

  return (
    <div style={{ width: item.size.width, height: item.size.height }}>
      <NodeResizer
        isVisible={selected}
        minWidth={150}
        minHeight={100}
        lineStyle={{ borderColor: 'var(--accent)', borderWidth: 1 }}
        handleStyle={{
          width: 8,
          height: 8,
          backgroundColor: 'var(--accent)',
          borderRadius: 2,
          border: 'none',
        }}
        onResize={(_event, params) => {
          updateItemSize(item.id, {
            width: params.width,
            height: params.height,
          });
        }}
      />
      {renderCard()}
    </div>
  );
}

export const BoardNode = memo(BoardNodeInner);
