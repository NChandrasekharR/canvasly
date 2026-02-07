import { useState, useRef } from 'react';
import { useBoardStore } from '../store/boardStore';

export function TopBar() {
  const { activeBoardId, activeBoardName, renameBoard, setView } = useBoardStore();
  const { searchQuery, setSearchQuery, tagFilter, setTagFilter, getAllTags } = useBoardStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(activeBoardName);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const submitName = async () => {
    if (activeBoardId && name.trim()) {
      await renameBoard(activeBoardId, name.trim());
    }
    setEditing(false);
  };

  const tags = getAllTags();

  return (
    <div
      className="absolute top-0 left-0 right-0 h-10 flex items-center justify-between px-4 z-10 select-none"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left: logo + board name */}
      <div className="flex items-center gap-3">
        <button
          className="font-bold text-sm tracking-wide cursor-pointer"
          style={{ color: 'var(--accent)' }}
          onClick={() => setView('home')}
          title="Back to Home"
        >
          MotionBoard
        </button>
        <span style={{ color: 'var(--border)' }}>|</span>
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={submitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitName();
              if (e.key === 'Escape') setEditing(false);
            }}
            className="text-sm px-1 py-0.5 rounded outline-none"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--accent)',
            }}
            autoFocus
          />
        ) : (
          <span
            className="text-sm cursor-pointer hover:underline"
            style={{ color: 'var(--text-primary)' }}
            onClick={() => {
              setName(activeBoardName);
              setEditing(true);
            }}
          >
            {activeBoardName}
          </span>
        )}
      </div>

      {/* Right: tag filter + search */}
      <div className="flex items-center gap-2">
        {/* Tag filter */}
        <div className="relative">
          <button
            className="text-xs px-2 py-1 rounded cursor-pointer"
            style={{
              backgroundColor: tagFilter ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: tagFilter ? 'white' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
            onClick={() => setShowTagDropdown(!showTagDropdown)}
          >
            {tagFilter ? `#${tagFilter}` : 'Tags'}
          </button>
          {showTagDropdown && (
            <div
              className="absolute top-full right-0 mt-1 rounded-lg shadow-xl py-1 min-w-[120px] z-50"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <button
                className="w-full text-left px-3 py-1.5 text-xs cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={() => {
                  setTagFilter(null);
                  setShowTagDropdown(false);
                }}
              >
                All
              </button>
              {tags.map((tag) => (
                <button
                  key={tag}
                  className="w-full text-left px-3 py-1.5 text-xs cursor-pointer"
                  style={{
                    color: tagFilter === tag ? 'var(--accent)' : 'var(--text-primary)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  onClick={() => {
                    setTagFilter(tag);
                    setShowTagDropdown(false);
                  }}
                >
                  #{tag}
                </button>
              ))}
              {tags.length === 0 && (
                <span className="block px-3 py-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  No tags yet
                </span>
              )}
            </div>
          )}
        </div>

        {/* Search */}
        <input
          ref={searchRef}
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-xs px-2 py-1 rounded outline-none w-32"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          }}
        />
      </div>
    </div>
  );
}
