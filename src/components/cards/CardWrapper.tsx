import { type ReactNode, useState } from 'react';
import { useBoardStore } from '../../store/boardStore';

interface CardWrapperProps {
  id: string;
  title: string;
  typeIcon: string;
  children: ReactNode;
  width: number;
  height: number;
}

export function CardWrapper({ id, title, typeIcon, children, width, height }: CardWrapperProps) {
  const removeItem = useBoardStore((s) => s.removeItem);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex flex-col rounded-lg overflow-hidden"
      style={{
        width,
        height,
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <div
        className="flex items-center gap-1.5 px-2 py-1 text-xs shrink-0 select-none"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span>{typeIcon}</span>
        <span className="truncate flex-1">{title}</span>
        {hovered && (
          <button
            className="ml-auto hover:text-red-400 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              removeItem(id);
            }}
            title="Delete"
          >
            ✕
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}
