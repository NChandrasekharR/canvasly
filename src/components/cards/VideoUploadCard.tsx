import { useState, useRef, useEffect } from 'react';
import { CardWrapper } from './CardWrapper';
import type { VideoUploadData } from '../../types';

interface VideoUploadCardProps {
  id: string;
  data: VideoUploadData;
  width: number;
  height: number;
  blobUrl?: string;
}

export function VideoUploadCard({ id, data, width, height, blobUrl }: VideoUploadCardProps) {
  const [hovered, setHovered] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    if (hovered) {
      videoRef.current.play().catch(() => {});
    } else if (!showControls) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [hovered, showControls]);

  const title = data.fileName ?? 'Video';
  const fileSizeMB = (data.fileSize / (1024 * 1024)).toFixed(1);

  return (
    <CardWrapper id={id} title={`${title} (${fileSizeMB} MB)`} typeIcon="🎬" width={width} height={height}>
      <div
        className="w-full h-full relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          if (!showControls) {
            setShowControls(false);
          }
        }}
      >
        {blobUrl ? (
          <video
            ref={videoRef}
            src={blobUrl}
            className="w-full h-full object-contain"
            loop
            muted
            playsInline
            controls={showControls}
            onClick={(e) => {
              e.stopPropagation();
              setShowControls(!showControls);
            }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Loading video...
            </span>
          </div>
        )}
        {/* Duration overlay */}
        {data.duration && (
          <div
            className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-xs"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }}
          >
            {formatDuration(data.duration)}
          </div>
        )}
      </div>
    </CardWrapper>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
