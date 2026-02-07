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

  return (
    <CardWrapper id={id} title={title} typeIcon="🖼" width={width} height={height}>
      <img
        src={src}
        alt={title}
        className="w-full h-full object-contain"
        draggable={false}
      />
    </CardWrapper>
  );
}
