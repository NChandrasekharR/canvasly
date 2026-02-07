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

export function BottomBar({ zoom, onAddClick }: BottomBarProps) {
  const itemCount = useBoardStore((s) => s.items.length);
  const storageUsage = useBoardStore((s) => s.storageUsage);
  const refreshStorageUsage = useBoardStore((s) => s.refreshStorageUsage);

  useEffect(() => {
    refreshStorageUsage();
  }, [refreshStorageUsage]);

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-8 flex items-center justify-between px-4 text-xs select-none z-10"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-secondary)',
      }}
    >
      <div className="flex items-center gap-4">
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span>Items: {itemCount}</span>
        <span>{formatBytes(storageUsage)} / ~500 MB</span>
      </div>
      <button
        onClick={onAddClick}
        className="w-6 h-6 rounded flex items-center justify-center text-white text-sm cursor-pointer"
        style={{ backgroundColor: 'var(--accent)' }}
        title="Add item"
      >
        +
      </button>
    </div>
  );
}
