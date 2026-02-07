import { type ReactNode, useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { TagEditor } from '../TagEditor';

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
  const bringToFront = useBoardStore((s) => s.bringToFront);
  const sendToBack = useBoardStore((s) => s.sendToBack);
  const item = useBoardStore((s) => s.items.find((i) => i.id === id));
  const [hovered, setHovered] = useState(false);
  const [showTags, setShowTags] = useState(false);

  const tags = item?.tags ?? [];

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
      onMouseLeave={() => {
        setHovered(false);
        setShowTags(false);
      }}
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
          <div className="flex items-center gap-1 ml-auto">
            <button
              className="hover:text-blue-400 transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); bringToFront(id); }}
              title="Bring to front"
            >
              ]
            </button>
            <button
              className="hover:text-blue-400 transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); sendToBack(id); }}
              title="Send to back"
            >
              [
            </button>
            <button
              className="hover:text-blue-400 transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setShowTags(!showTags); }}
              title="Tags"
            >
              #
            </button>
            <button
              className="hover:text-red-400 transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); removeItem(id); }}
              title="Delete"
            >
              x
            </button>
          </div>
        )}
      </div>

      {/* Tags bar */}
      {(showTags || tags.length > 0) && (
        <div
          className="px-2 py-1 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <TagEditor itemId={id} tags={tags} />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}
