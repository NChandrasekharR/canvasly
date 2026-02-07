import { useState } from 'react';
import { CardWrapper } from './CardWrapper';
import type { VideoEmbedData } from '../../types';

interface VideoEmbedCardProps {
  id: string;
  data: VideoEmbedData;
  width: number;
  height: number;
}

export function VideoEmbedCard({ id, data, width, height }: VideoEmbedCardProps) {
  const [playing, setPlaying] = useState(false);
  const title = data.title ?? data.url;

  const platformBadge =
    data.platform === 'youtube' ? 'YT' : data.platform === 'vimeo' ? 'VM' : '▶';

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
        onMouseLeave={() => setPlaying(false)}
      >
        {playing ? (
          <iframe
            src={data.embedUrl}
            className="w-full h-full border-0"
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
            {/* Play overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
              >
                ▶
              </div>
            </div>
            {/* Platform badge */}
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
      </div>
    </CardWrapper>
  );
}
