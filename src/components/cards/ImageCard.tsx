import { useState } from 'react';
import { CardWrapper } from './CardWrapper';
import type { ImageItemData } from '../../types';

interface ImageCardProps {
  id: string;
  data: ImageItemData;
  width: number;
  height: number;
}

export function ImageCard({ id, data, width, height }: ImageCardProps) {
  const src = data.url ?? '';
  const title = data.fileName ?? data.caption ?? 'Image';
  const [failed, setFailed] = useState(false);

  return (
    <CardWrapper id={id} title={title} typeIcon="🖼" width={width} height={height}>
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
          <span style={{ fontSize: 32, opacity: 0.4 }}>🖼</span>
          <span className="text-xs font-medium">{title}</span>
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
            {failed ? 'Image failed to load' : 'No image data'}
          </span>
        </div>
      )}
    </CardWrapper>
  );
}
