import { useEffect, useState } from 'react';
import { useBoardStore } from '../store/boardStore';

export function HomeView() {
  const { boards, loadBoards, createNewBoard, openBoard, renameBoard, deleteBoard, duplicateBoard } =
    useBoardStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
      <div
        className="flex items-center justify-between px-8 py-6"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
          MotionBoard
        </h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer transition-colors"
          style={{ backgroundColor: 'var(--accent)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
        >
          + New Board
        </button>
      </div>

      {/* Board Grid */}
      <div className="flex-1 overflow-auto p-8">
        {boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              No boards yet
            </p>
            <button
              onClick={handleCreate}
              className="px-6 py-3 rounded-lg text-sm font-medium text-white cursor-pointer"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Create your first board
            </button>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {boards.map((board) => (
              <div
                key={board.id}
                className="group rounded-lg overflow-hidden cursor-pointer transition-all"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                onClick={() => {
                  if (editingId !== board.id && deleteConfirmId !== board.id) {
                    openBoard(board.id);
                  }
                }}
              >
                {/* Thumbnail area */}
                <div
                  className="h-36 flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <span className="text-3xl" style={{ color: 'var(--text-secondary)' }}>
                    {board.itemCount > 0 ? `${board.itemCount} items` : 'Empty'}
                  </span>
                </div>

                {/* Info */}
                <div className="p-3">
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
                      className="w-full px-1 py-0.5 rounded text-sm outline-none"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--accent)',
                      }}
                      autoFocus
                    />
                  ) : (
                    <h3 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {board.name}
                    </h3>
                  )}
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(board.updatedAt)}
                  </p>

                  {deleteConfirmId === board.id ? (
                    <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Delete?
                      </span>
                      <button
                        onClick={() => confirmDelete(board.id)}
                        className="text-xs text-red-400 cursor-pointer hover:text-red-300"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="text-xs cursor-pointer"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => startRename(board.id, board.name)}
                        className="text-xs cursor-pointer hover:underline"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => duplicateBoard(board.id)}
                        className="text-xs cursor-pointer hover:underline"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(board.id)}
                        className="text-xs cursor-pointer hover:underline text-red-400"
                      >
                        Delete
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
