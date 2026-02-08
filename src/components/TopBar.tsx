import { useState, useRef, useEffect } from 'react';
import { useBoardStore } from '../store/boardStore';
import { exportBoard, downloadBlob } from '../utils/exportImport';

/* ─── SVG Icons ─── */
const IconHome = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6.5 8 2l6 4.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5Z"/><path d="M6 14V9h4v5"/></svg>
);
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="m13 13-2.5-2.5"/></svg>
);
const IconTag = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 9.2V2.5A1 1 0 0 1 2.5 1.5h6.7a1 1 0 0 1 .7.3l5.3 5.3a1 1 0 0 1 0 1.4l-5.3 5.3a1 1 0 0 1-1.4 0L1.8 9.9a1 1 0 0 1-.3-.7Z"/><circle cx="5.5" cy="5.5" r="1" fill="currentColor"/></svg>
);
const IconExport = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 10V2M5 5l3-3 3 3M3 12v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1"/></svg>
);
const IconChevron = () => (
  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m4 6 4 4 4-4"/></svg>
);
const IconX = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m4 4 8 8M12 4l-8 8"/></svg>
);

export function TopBar() {
  const { activeBoardId, activeBoardName, renameBoard, setView } = useBoardStore();
  const { searchQuery, setSearchQuery, tagFilter, setTagFilter, getAllTags } = useBoardStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(activeBoardName);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  const submitName = async () => {
    if (activeBoardId && name.trim()) {
      await renameBoard(activeBoardId, name.trim());
    }
    setEditing(false);
  };

  // Close tag dropdown on outside click
  useEffect(() => {
    if (!showTagDropdown) return;
    function handleClick(e: MouseEvent) {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setShowTagDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showTagDropdown]);

  const tags = getAllTags();

  return (
    <div
      className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-4 z-10 select-none"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left: navigation + board name */}
      <div className="flex items-center gap-2.5">
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer btn-ghost"
          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          onClick={() => setView('home')}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          data-tooltip="Back to Home"
          data-tooltip-pos="bottom"
        >
          <IconHome />
        </button>
        <div
          className="w-px h-5"
          style={{ backgroundColor: 'var(--border)' }}
        />
        <span
          className="text-xs font-bold tracking-wide"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)' }}
        >
          MB
        </span>
        <div
          className="w-px h-5"
          style={{ backgroundColor: 'var(--border)' }}
        />
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={submitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitName();
              if (e.key === 'Escape') setEditing(false);
            }}
            className="text-sm font-medium px-2 py-1 rounded-md outline-none"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--accent)',
              minWidth: '120px',
            }}
            autoFocus
          />
        ) : (
          <button
            className="text-sm font-medium px-2 py-1 rounded-md cursor-pointer btn-ghost"
            style={{ color: 'var(--text-primary)' }}
            onClick={() => {
              setName(activeBoardName);
              setEditing(true);
            }}
            data-tooltip="Click to rename"
            data-tooltip-pos="bottom"
          >
            {activeBoardName}
          </button>
        )}
      </div>

      {/* Right: tag filter + search + export */}
      <div className="flex items-center gap-2">
        {/* Tag filter */}
        <div className="relative" ref={tagDropdownRef}>
          <button
            className="h-8 px-2.5 rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-all"
            style={{
              backgroundColor: tagFilter ? 'var(--secondary-muted)' : 'var(--bg-tertiary)',
              color: tagFilter ? 'var(--secondary)' : 'var(--text-secondary)',
              border: `1px solid ${tagFilter ? 'var(--secondary)' : 'var(--border)'}`,
            }}
            onClick={() => setShowTagDropdown(!showTagDropdown)}
          >
            <IconTag />
            {tagFilter ? `#${tagFilter}` : 'Tags'}
            <IconChevron />
          </button>
          {showTagDropdown && (
            <div
              className="absolute top-full right-0 mt-1.5 rounded-lg py-1 min-w-[160px] z-50 animate-scale-in"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow)',
              }}
            >
              <button
                className="w-full text-left px-3 py-2 text-xs font-medium cursor-pointer btn-ghost flex items-center gap-2"
                style={{ color: tagFilter ? 'var(--text-secondary)' : 'var(--accent)' }}
                onClick={() => {
                  setTagFilter(null);
                  setShowTagDropdown(false);
                }}
              >
                All items
                {!tagFilter && (
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}><path d="m3 8 4 4 6-8"/></svg>
                )}
              </button>
              {tags.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', margin: '2px 0' }} />
              )}
              {tags.map((tag) => (
                <button
                  key={tag}
                  className="w-full text-left px-3 py-2 text-xs cursor-pointer btn-ghost flex items-center gap-2"
                  style={{
                    color: tagFilter === tag ? 'var(--secondary)' : 'var(--text-primary)',
                  }}
                  onClick={() => {
                    setTagFilter(tag);
                    setShowTagDropdown(false);
                  }}
                >
                  <span style={{ color: 'var(--text-tertiary)' }}>#</span>
                  {tag}
                  {tagFilter === tag && (
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}><path d="m3 8 4 4 6-8"/></svg>
                  )}
                </button>
              ))}
              {tags.length === 0 && (
                <span className="block px-3 py-2 text-xs italic" style={{ color: 'var(--text-tertiary)' }}>
                  No tags yet
                </span>
              )}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative flex items-center">
          <div className="absolute left-2.5 pointer-events-none" style={{ color: 'var(--text-tertiary)' }}>
            <IconSearch />
          </div>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs pl-8 pr-7 rounded-lg outline-none w-44 transition-all"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.width = '220px'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; if (!searchQuery) e.currentTarget.style.width = '176px'; }}
          />
          {searchQuery && (
            <button
              className="absolute right-2 cursor-pointer"
              style={{ color: 'var(--text-tertiary)' }}
              onClick={() => setSearchQuery('')}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
            >
              <IconX />
            </button>
          )}
        </div>

        {/* Export */}
        <button
          className="h-8 px-2.5 rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1.5 btn-ghost"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}
          onClick={async () => {
            if (!activeBoardId) return;
            const blob = await exportBoard(activeBoardId);
            downloadBlob(blob, `${activeBoardName}.motionboard`);
          }}
          data-tooltip="Export board"
          data-tooltip-pos="bottom"
        >
          <IconExport />
          Export
        </button>
      </div>
    </div>
  );
}
