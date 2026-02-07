import { useEffect, useState } from 'react';
import { useBoardStore } from '../store/boardStore';

export function Sidebar() {
  const { boards, loadBoards, openBoard, activeBoardId, createNewBoard, setView } = useBoardStore();
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  return (
    <div
      className="absolute left-0 top-10 bottom-8 z-20 flex"
      style={{ pointerEvents: 'none' }}
    >
      {/* Toggle button */}
      <button
        className="self-start mt-2 ml-1 w-6 h-6 rounded flex items-center justify-center text-xs cursor-pointer"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          color: 'var(--text-secondary)',
          pointerEvents: 'auto',
        }}
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Show boards' : 'Hide boards'}
      >
        {collapsed ? '>' : '<'}
      </button>

      {/* Sidebar panel */}
      {!collapsed && (
        <div
          className="w-48 h-full flex flex-col overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border)',
            pointerEvents: 'auto',
          }}
        >
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Boards
            </span>
            <button
              onClick={() => setView('home')}
              className="text-xs cursor-pointer"
              style={{ color: 'var(--accent)' }}
            >
              Home
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            {boards.map((board) => (
              <button
                key={board.id}
                className="w-full text-left px-3 py-2 text-xs truncate cursor-pointer transition-colors"
                style={{
                  backgroundColor:
                    board.id === activeBoardId ? 'var(--bg-tertiary)' : 'transparent',
                  color:
                    board.id === activeBoardId
                      ? 'var(--text-primary)'
                      : 'var(--text-secondary)',
                  borderLeft:
                    board.id === activeBoardId
                      ? '2px solid var(--accent)'
                      : '2px solid transparent',
                }}
                onClick={() => openBoard(board.id)}
              >
                {board.name}
              </button>
            ))}
          </div>

          <button
            className="px-3 py-2 text-xs cursor-pointer"
            style={{
              color: 'var(--accent)',
              borderTop: '1px solid var(--border)',
            }}
            onClick={async () => {
              const id = await createNewBoard();
              await openBoard(id);
            }}
          >
            + New Board
          </button>
        </div>
      )}
    </div>
  );
}
