import { useEffect, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { CardWrapper } from './CardWrapper';
import { useBoardStore } from '../../store/boardStore';
import type { LottieData } from '../../types';

interface LottieCardProps {
  id: string;
  data: LottieData;
  width: number;
  height: number;
}

export function LottieCard({ id, data, width, height }: LottieCardProps) {
  const updateItemData = useBoardStore((s) => s.updateItemData);
  const [animationUrl, setAnimationUrl] = useState<string | null>(null);

  useEffect(() => {
    if (data.animationData) {
      const blob = new Blob([JSON.stringify(data.animationData)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      setAnimationUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (data.url) {
      setAnimationUrl(data.url);
    }
  }, [data.animationData, data.url]);

  const title = data.fileName ?? 'Lottie Animation';
  const speed = data.speed ?? 1;

  const handleSpeedChange = (newSpeed: number) => {
    updateItemData(id, { speed: newSpeed } as Partial<LottieData>);
  };

  return (
    <CardWrapper id={id} title={title} typeIcon="*" width={width} height={height}>
      <div className="w-full h-full flex flex-col">
        <div className="flex-1 overflow-hidden">
          {animationUrl ? (
            <DotLottieReact
              src={animationUrl}
              autoplay
              loop
              speed={speed}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              No animation data
            </div>
          )}
        </div>
        <div
          className="flex items-center justify-center gap-1 py-1 px-2 shrink-0"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              className="px-2 py-0.5 rounded text-xs cursor-pointer"
              style={{
                backgroundColor: speed === s ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: speed === s ? 'white' : 'var(--text-secondary)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleSpeedChange(s);
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </CardWrapper>
  );
}
