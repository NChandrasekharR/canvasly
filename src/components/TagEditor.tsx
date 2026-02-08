import { useState } from 'react';
import { useBoardStore } from '../store/boardStore';

interface TagEditorProps {
  itemId: string;
  tags: string[];
}

export function TagEditor({ itemId, tags }: TagEditorProps) {
  const updateItemTags = useBoardStore((s) => s.updateItemTags);
  const [newTag, setNewTag] = useState('');
  const [showInput, setShowInput] = useState(false);

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      updateItemTags(itemId, [...tags, tag]);
    }
    setNewTag('');
    setShowInput(false);
  };

  const removeTag = (tag: string) => {
    updateItemTags(itemId, tags.filter((t) => t !== tag));
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors"
          style={{
            backgroundColor: 'var(--secondary-muted)',
            color: 'var(--secondary)',
          }}
        >
          #{tag}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag);
            }}
            className="cursor-pointer transition-colors rounded-full w-3.5 h-3.5 flex items-center justify-center"
            style={{ color: 'var(--secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--secondary)'; }}
          >
            <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="m4 4 8 8M12 4l-8 8"/></svg>
          </button>
        </span>
      ))}
      {showInput ? (
        <input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onBlur={addTag}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addTag();
            if (e.key === 'Escape') { setShowInput(false); setNewTag(''); }
          }}
          className="px-2 py-0.5 rounded-full text-[10px] outline-none w-16"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--secondary)',
          }}
          autoFocus
          placeholder="tag name"
        />
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowInput(true);
          }}
          className="px-2 py-0.5 rounded-full text-[10px] cursor-pointer transition-colors font-medium"
          style={{ color: 'var(--text-tertiary)', border: '1px dashed var(--border)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--secondary)'; e.currentTarget.style.borderColor = 'var(--secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          + tag
        </button>
      )}
    </div>
  );
}
