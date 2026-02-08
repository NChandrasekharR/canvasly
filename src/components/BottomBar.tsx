import { useEffect } from 'react';
import { useBoardStore } from '../store/boardStore';

interface BottomBarProps {
  zoom: number;
  onAddClick: (e: React.MouseEvent) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
);

const IconZoom = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="m13 13-2.5-2.5"/><path d="M5 7h4"/><path d="M7 5v4"/></svg>
);

export function BottomBar({ zoom, onAddClick }: BottomBarProps) {
  const itemCount = useBoardStore((s) => s.items.length);
  const storageUsage = useBoardStore((s) => s.storageUsage);
  const refreshStorageUsage = useBoardStore((s) => s.refreshStorageUsage);

  useEffect(() => {
    refreshStorageUsage();
  }, [refreshStorageUsage]);

  const maxStorage = 500 * 1024 * 1024; // ~500 MB
  const storagePercent = Math.min((storageUsage / maxStorage) * 100, 100);

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-9 flex items-center justify-between px-4 text-xs select-none z-10"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-tertiary)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Zoom */}
        <div className="flex items-center gap-1.5" data-tooltip="Canvas zoom level" data-tooltip-pos="top" style={{ position: 'relative' }}>
          <IconZoom />
          <span className="font-medium" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            {Math.round(zoom * 100)}%
          </span>
        </div>

        <div className="w-px h-3.5" style={{ backgroundColor: 'var(--border)' }} />

        {/* Item count */}
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="5" height="5" rx="1"/>
            <rect x="9" y="2" width="5" height="5" rx="1"/>
            <rect x="2" y="9" width="5" height="5" rx="1"/>
            <rect x="9" y="9" width="5" height="5" rx="1"/>
          </svg>
          {itemCount} item{itemCount !== 1 ? 's' : ''}
        </span>

        <div className="w-px h-3.5" style={{ backgroundColor: 'var(--border)' }} />

        {/* Storage */}
        <div className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="8" cy="4" rx="6" ry="2.5"/>
            <path d="M2 4v4c0 1.4 2.7 2.5 6 2.5S14 9.4 14 8V4"/>
            <path d="M2 8v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V8"/>
          </svg>
          <div
            className="w-16 h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${storagePercent}%`,
                backgroundColor: storagePercent > 80 ? 'var(--danger)' : 'var(--accent)',
              }}
            />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
            {formatBytes(storageUsage)}
          </span>
        </div>
      </div>

      {/* Add button */}
      <button
        onClick={onAddClick}
        className="h-7 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer transition-all"
        style={{ backgroundColor: 'var(--accent)', color: '#000' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--accent)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        data-tooltip="Add item (double-click canvas)"
      >
        <IconPlus />
        Add
      </button>
    </div>
  );
}
