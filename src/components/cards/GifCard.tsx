import { useState } from 'react';
import { CardWrapper } from './CardWrapper';
import type { ImageItemData } from '../../types';

interface GifCardProps {
  id: string;
  data: ImageItemData;
  width: number;
  height: number;
  blobUrl?: string;
}

export function GifCard({ id, data, width, height, blobUrl }: GifCardProps) {
  const src = blobUrl ?? data.url ?? '';
  const title = data.fileName ?? 'GIF';
  const [failed, setFailed] = useState(false);

  return (
    <CardWrapper id={id} title={title} typeIcon="🎞" width={width} height={height}>
      {src && !failed ? (
        <img
          src={src}
          alt={title}
          className="w-full h-full object-contain"
          draggable={false}
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
        >
          <span style={{ fontSize: 32, opacity: 0.4 }}>🎞</span>
          <span className="text-xs font-medium">{title}</span>
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
            {failed ? 'GIF failed to load' : 'No image data'}
          </span>
        </div>
      )}
    </CardWrapper>
  );
}
