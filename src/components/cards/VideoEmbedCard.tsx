import { useRef, useState } from 'react';
import { CardWrapper } from './CardWrapper';
import { useBoardStore } from '../../store/boardStore';
import type { VideoEmbedData } from '../../types';

interface VideoEmbedCardProps {
  id: string;
  data: VideoEmbedData;
  width: number;
  height: number;
}

const INTERACTIVE = 'nodrag nopan nowheel';

export function VideoEmbedCard({ id, data, width, height }: VideoEmbedCardProps) {
  const updateItemSize = useBoardStore((s) => s.updateItemSize);
  const [playing, setPlaying] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const restingSize = useRef({ width, height });

  const title = data.title ?? data.url;
  const platformBadge =
    data.platform === 'youtube' ? 'YT' : data.platform === 'vimeo' ? 'VM' : '▶';

  const toggleExpanded = () => {
    if (!expanded) {
      restingSize.current = { width, height };
      useBoardStore.getState()._pushUndoState();
      updateItemSize(id, { width: Math.max(width, 640), height: Math.max(height, 420) });
      setExpanded(true);
      setPlaying(true);
      setInteractive(true);
      return;
    }
    useBoardStore.getState()._pushUndoState();
    updateItemSize(id, restingSize.current);
    setExpanded(false);
  };

  return (
    <CardWrapper
      id={id}
      title={`${platformBadge} ${title}`}
      typeIcon="▶"
      width={width}
      height={height}
    >
      <div
        className="w-full h-full relative"
        onMouseEnter={() => setPlaying(true)}
        onMouseLeave={() => {
          setPlaying(false);
          setInteractive(false);
        }}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        {playing ? (
          <iframe
            src={data.embedUrl}
            className={`${INTERACTIVE} w-full h-full border-0`}
            // pointer-events none keeps the hover on this card. An iframe under the
            // cursor would fire mouseleave and immediately stop playback.
            style={{ pointerEvents: interactive ? 'auto' : 'none' }}
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={title}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative">
            {data.thumbnailUrl ? (
              <img
                src={data.thumbnailUrl}
                alt={title}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-4xl"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                ▶
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
              >
                ▶
              </div>
            </div>
            <div
              className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-semibold"
              style={{
                backgroundColor:
                  data.platform === 'youtube'
                    ? '#FF0000'
                    : data.platform === 'vimeo'
                      ? '#1AB7EA'
                      : 'var(--accent)',
                color: 'white',
              }}
            >
              {platformBadge}
            </div>
          </div>
        )}
        <button
          className={`${INTERACTIVE} absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer`}
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }}
          onClick={(event) => {
            event.stopPropagation();
            toggleExpanded();
          }}
        >
          {expanded ? 'Shrink' : 'Expand'}
        </button>
        {playing && !interactive && (
          <button
            className={`${INTERACTIVE} absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer`}
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }}
            onClick={(event) => {
              event.stopPropagation();
              setInteractive(true);
            }}
          >
            Controls
          </button>
        )}
      </div>
    </CardWrapper>
  );
}
