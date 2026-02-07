import { useState } from 'react';
import { useBoardStore } from '../store/boardStore';

export function TopBar() {
  const { activeBoardId, activeBoardName, renameBoard, setView } = useBoardStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(activeBoardName);

  const submitName = async () => {
    if (activeBoardId && name.trim()) {
      await renameBoard(activeBoardId, name.trim());
    }
    setEditing(false);
  };

  return (
    <div
      className="absolute top-0 left-0 right-0 h-10 flex items-center px-4 z-10 select-none"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
      }}
    >
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
    </div>
  );
}
