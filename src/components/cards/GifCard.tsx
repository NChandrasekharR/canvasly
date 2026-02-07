import { CardWrapper } from './CardWrapper';
import type { ImageItemData } from '../../types';

interface GifCardProps {
  id: string;
  data: ImageItemData;
  width: number;
  height: number;
}

export function GifCard({ id, data, width, height }: GifCardProps) {
  const src = data.url ?? '';
  const title = data.fileName ?? 'GIF';

  return (
    <CardWrapper id={id} title={title} typeIcon="🎞" width={width} height={height}>
      <img
        src={src}
        alt={title}
        className="w-full h-full object-contain"
        draggable={false}
      />
    </CardWrapper>
  );
}
