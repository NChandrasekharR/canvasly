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
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'white',
            opacity: 0.9,
          }}
        >
          {tag}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag);
            }}
            className="ml-0.5 cursor-pointer hover:text-red-200"
          >
            x
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
            if (e.key === 'Escape') setShowInput(false);
          }}
          className="px-1 py-0.5 rounded text-xs outline-none w-16"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          }}
          autoFocus
          placeholder="tag"
        />
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowInput(true);
          }}
          className="px-1 py-0.5 rounded text-xs cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
        >
          +tag
        </button>
      )}
    </div>
  );
}
