interface TopBarProps {
  boardName: string;
}

export function TopBar({ boardName }: TopBarProps) {
  return (
    <div
      className="absolute top-0 left-0 right-0 h-10 flex items-center px-4 z-10 select-none"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="font-bold text-sm tracking-wide"
          style={{ color: 'var(--accent)' }}
        >
          MotionBoard
        </span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
          {boardName}
        </span>
      </div>
    </div>
  );
}
