import { useEffect, useRef, useState } from 'react';
import { useBoardStore } from '../store/boardStore';
import { exportBoard, importBoard, downloadBlob } from '../utils/exportImport';

/* ─── SVG Icons ─── */
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
);
const IconSun = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="3.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/></svg>
);
const IconMoon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13.9 8.8A6 6 0 0 1 7.2 2.1 6 6 0 1 0 13.9 8.8Z"/></svg>
);
const IconImport = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v8M5 7l3 3 3-3M3 12v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1"/></svg>
);
const IconExport = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 10V2M5 5l3-3 3 3M3 12v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1"/></svg>
);
const IconEdit = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5Z"/></svg>
);
const IconCopy = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="5" width="9" height="9" rx="1"/><path d="M2 11V2a1 1 0 0 1 1-1h9"/></svg>
);
const IconTrash = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4h12M5 4V2.5A1.5 1.5 0 0 1 6.5 1h3A1.5 1.5 0 0 1 11 2.5V4M13 4v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4"/></svg>
);

export function HomeView() {
  const { boards, loadBoards, createNewBoard, openBoard, renameBoard, deleteBoard, duplicateBoard, theme, toggleTheme } =
    useBoardStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  const handleCreate = async () => {
    const id = await createNewBoard();
    await openBoard(id);
  };

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const submitRename = async () => {
    if (editingId && editName.trim()) {
      await renameBoard(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const confirmDelete = async (id: string) => {
    await deleteBoard(id);
    setDeleteConfirmId(null);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="h-full w-full flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-10 py-7 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-4">
          <h1
            className="text-2xl tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)', fontWeight: 800 }}
          >
            MotionBoard
          </h1>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}
          >
            {boards.length} board{boards.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer btn-ghost"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
            data-tooltip={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
          <button
            onClick={() => importInputRef.current?.click()}
            className="h-9 px-3.5 rounded-lg text-sm font-medium cursor-pointer btn-ghost flex items-center gap-2"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
            data-tooltip="Import .motionboard file"
          >
            <IconImport />
            Import
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".motionboard"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                await importBoard(file);
                await loadBoards();
              }
              e.target.value = '';
            }}
          />
          <button
            onClick={handleCreate}
            className="h-9 px-4 rounded-lg text-sm font-semibold cursor-pointer flex items-center gap-2 transition-all"
            style={{ backgroundColor: 'var(--accent)', color: '#000' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <IconPlus />
            New Board
          </button>
        </div>
      </header>

      {/* Board Grid */}
      <div className="flex-1 overflow-auto p-10">
        {boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 animate-fade-in">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-muted)' }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <path d="M12 8v8M8 12h8"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                No boards yet
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Create your first moodboard to get started
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="h-11 px-6 rounded-lg text-sm font-semibold cursor-pointer flex items-center gap-2 transition-all"
              style={{ backgroundColor: 'var(--accent)', color: '#000' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(245, 158, 11, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <IconPlus />
              Create Board
            </button>
          </div>
        ) : (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {boards.map((board, index) => (
              <div
                key={board.id}
                className="group rounded-xl overflow-hidden cursor-pointer transition-all animate-slide-up"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  animationDelay: `${index * 40}ms`,
                  animationFillMode: 'both',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => {
                  if (editingId !== board.id && deleteConfirmId !== board.id) {
                    openBoard(board.id);
                  }
                }}
              >
                {/* Thumbnail area */}
                <div
                  className="h-40 flex items-center justify-center relative overflow-hidden"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  {board.itemCount > 0 ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-tertiary)' }}>
                        {board.itemCount}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                        item{board.itemCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                      Empty
                    </span>
                  )}

                  {/* Floating action buttons */}
                  <div
                    className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={async () => {
                        const blob = await exportBoard(board.id);
                        downloadBlob(blob, `${board.name}.motionboard`);
                      }}
                      className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-colors"
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                      data-tooltip="Export"
                    >
                      <IconExport />
                    </button>
                    <button
                      onClick={() => startRename(board.id, board.name)}
                      className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-colors"
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                      data-tooltip="Rename"
                    >
                      <IconEdit />
                    </button>
                    <button
                      onClick={() => duplicateBoard(board.id)}
                      className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-colors"
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                      data-tooltip="Duplicate"
                    >
                      <IconCopy />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(board.id)}
                      className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-colors"
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                      data-tooltip="Delete"
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="px-4 py-3.5">
                  {editingId === board.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={submitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitRename();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-2 py-1 rounded-md text-sm outline-none"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--accent)',
                      }}
                      autoFocus
                    />
                  ) : (
                    <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {board.name}
                    </h3>
                  )}
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
                    Updated {formatDate(board.updatedAt)}
                  </p>

                  {deleteConfirmId === board.id && (
                    <div
                      className="flex items-center gap-3 mt-3 p-2.5 rounded-md animate-scale-in"
                      style={{ backgroundColor: 'var(--danger-muted)', border: '1px solid var(--danger)' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs font-medium flex-1" style={{ color: 'var(--danger)' }}>
                        Delete this board?
                      </span>
                      <button
                        onClick={() => confirmDelete(board.id)}
                        className="text-xs font-semibold px-2.5 py-1 rounded cursor-pointer transition-colors"
                        style={{ backgroundColor: 'var(--danger)', color: 'white' }}
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="text-xs font-medium px-2.5 py-1 rounded cursor-pointer"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
