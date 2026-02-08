import { type ReactNode, useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { TagEditor } from '../TagEditor';

/* ─── SVG Icons ─── */
const IconLayerUp = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10h10M8 6V2M6 4l2-2 2 2"/></svg>
);
const IconLayerDown = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h10M8 10v4M6 12l2 2 2-2"/></svg>
);
const IconTag = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 9.2V2.5A1 1 0 0 1 2.5 1.5h6.7a1 1 0 0 1 .7.3l5.3 5.3a1 1 0 0 1 0 1.4l-5.3 5.3a1 1 0 0 1-1.4 0L1.8 9.9a1 1 0 0 1-.3-.7Z"/><circle cx="5.5" cy="5.5" r="1" fill="currentColor"/></svg>
);
const IconX = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m4 4 8 8M12 4l-8 8"/></svg>
);

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
      className="flex flex-col overflow-hidden"
      style={{
        width,
        height,
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        transition: 'border-color 0.15s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setShowTags(false);
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs shrink-0 select-none"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span className="opacity-60 text-[10px]">{typeIcon}</span>
        <span className="truncate flex-1 text-[11px] font-medium">{title}</span>
        {item && (
          <span className="text-[9px] tabular-nums shrink-0" style={{ color: 'var(--text-tertiary)' }}>
            {Math.round(item.position.x)}, {Math.round(item.position.y)}
          </span>
        )}
        {hovered && (
          <div className="flex items-center gap-0.5 ml-auto animate-fade-in">
            <button
              className="w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); bringToFront(id); }}
              title="Bring to front"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'var(--accent-muted)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <IconLayerUp />
            </button>
            <button
              className="w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); sendToBack(id); }}
              title="Send to back"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'var(--accent-muted)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <IconLayerDown />
            </button>
            <button
              className="w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setShowTags(!showTags); }}
              title="Tags"
              style={{ color: showTags ? 'var(--secondary)' : 'var(--text-tertiary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--secondary)'; e.currentTarget.style.backgroundColor = 'var(--secondary-muted)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = showTags ? 'var(--secondary)' : 'var(--text-tertiary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <IconTag />
            </button>
            <button
              className="w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); removeItem(id); }}
              title="Delete"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.backgroundColor = 'var(--danger-muted)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <IconX />
            </button>
          </div>
        )}
      </div>

      {/* Tags bar */}
      {(showTags || tags.length > 0) && (
        <div
          className="px-2.5 py-1.5 shrink-0"
          style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}
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
