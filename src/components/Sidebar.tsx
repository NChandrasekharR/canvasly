import { useEffect, useState } from 'react';
import { useBoardStore } from '../store/boardStore';

const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 4 4 4-4 4"/></svg>
);
const IconChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10 4-4 4 4 4"/></svg>
);
const IconHome = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6.5 8 2l6 4.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5Z"/><path d="M6 14V9h4v5"/></svg>
);
const IconPlus = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
);

export function Sidebar() {
  const { boards, loadBoards, openBoard, activeBoardId, createNewBoard, setView } = useBoardStore();
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  return (
    <div
      className="absolute left-0 top-12 bottom-9 z-20 flex"
      style={{ pointerEvents: 'none' }}
    >
      {/* Toggle button */}
      <button
        className="self-start mt-3 ml-2 w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-all"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          color: 'var(--text-secondary)',
          pointerEvents: 'auto',
        }}
        onClick={() => setCollapsed(!collapsed)}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        data-tooltip={collapsed ? 'Show boards' : 'Hide boards'}
        data-tooltip-pos="bottom"
      >
        {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
      </button>

      {/* Sidebar panel */}
      {!collapsed && (
        <div
          className="w-52 h-full flex flex-col overflow-hidden animate-slide-right"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border)',
            pointerEvents: 'auto',
          }}
        >
          <div
            className="flex items-center justify-between px-3.5 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Boards
            </span>
            <button
              onClick={() => setView('home')}
              className="w-6 h-6 rounded flex items-center justify-center cursor-pointer btn-ghost"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
              data-tooltip="Home"
              data-tooltip-pos="bottom"
            >
              <IconHome />
            </button>
          </div>

          <div className="flex-1 overflow-auto py-1">
            {boards.map((board) => (
              <button
                key={board.id}
                className="w-full text-left px-3.5 py-2.5 text-xs truncate cursor-pointer transition-all flex items-center gap-2"
                style={{
                  backgroundColor:
                    board.id === activeBoardId ? 'var(--accent-muted)' : 'transparent',
                  color:
                    board.id === activeBoardId
                      ? 'var(--accent)'
                      : 'var(--text-secondary)',
                  borderLeft:
                    board.id === activeBoardId
                      ? '2px solid var(--accent)'
                      : '2px solid transparent',
                  fontWeight: board.id === activeBoardId ? 600 : 400,
                }}
                onMouseEnter={(e) => {
                  if (board.id !== activeBoardId) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (board.id !== activeBoardId) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
                onClick={() => openBoard(board.id)}
              >
                <span className="truncate">{board.name}</span>
              </button>
            ))}
          </div>

          <button
            className="px-3.5 py-3 text-xs font-medium cursor-pointer flex items-center gap-2 transition-colors"
            style={{
              color: 'var(--accent)',
              borderTop: '1px solid var(--border)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-muted)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            onClick={async () => {
              const id = await createNewBoard();
              await openBoard(id);
            }}
          >
            <IconPlus />
            New Board
          </button>
        </div>
      )}
    </div>
  );
}
