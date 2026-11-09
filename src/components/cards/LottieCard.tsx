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
  blobUrl?: string;
}

function asAnimationData(value: object | null | undefined): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

export function LottieCard({ id, data, width, height, blobUrl }: LottieCardProps) {
  const updateItemData = useBoardStore((s) => s.updateItemData);
  const [blobData, setBlobData] = useState<Record<string, unknown> | null>(null);
  const [blobFailed, setBlobFailed] = useState(false);

  // Large animations are stored as blobs. Load the JSON here instead of a blob
  // URL created during render — Strict Mode would revoke that URL before playback.
  useEffect(() => {
    if (!blobUrl || data.animationData) return;
    let cancelled = false;
    fetch(blobUrl)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to read Lottie blob');
        return response.json() as Promise<unknown>;
      })
      .then((json) => {
        if (cancelled) return;
        if (json && typeof json === 'object' && !Array.isArray(json)) {
          setBlobData(json as Record<string, unknown>);
          setBlobFailed(false);
        } else {
          setBlobFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setBlobFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [blobUrl, data.animationData]);

  const inlineData = asAnimationData(data.animationData);
  const animationData = inlineData ?? blobData ?? undefined;
  const remoteUrl = animationData ? undefined : data.url;
  const title = data.fileName ?? 'Lottie Animation';
  const speed = data.speed ?? 1;

  const handleSpeedChange = (newSpeed: number) => {
    updateItemData(id, { speed: newSpeed } as Partial<LottieData>);
  };

  return (
    <CardWrapper id={id} title={title} typeIcon="*" width={width} height={height}>
      <div className="w-full h-full flex flex-col">
        <div className="flex-1 overflow-hidden">
          {animationData || remoteUrl ? (
            <DotLottieReact
              data={animationData}
              src={remoteUrl}
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
              {blobUrl && !blobFailed ? 'Loading animation...' : 'No animation data'}
            </div>
          )}
        </div>
        <div
          className="nodrag nopan nowheel flex items-center justify-center gap-1 py-1 px-2 shrink-0"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              className="nodrag nopan px-2 py-0.5 rounded text-xs cursor-pointer"
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
