import { useBoardStore } from '../store/boardStore';

interface BottomBarProps {
  zoom: number;
  onAddClick: (e: React.MouseEvent) => void;
}

export function BottomBar({ zoom, onAddClick }: BottomBarProps) {
  const itemCount = useBoardStore((s) => s.items.length);

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
