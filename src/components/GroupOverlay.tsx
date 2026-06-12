import { ViewportPortal } from '@xyflow/react';
import { useBoardStore } from '../store/boardStore';

const PADDING = 14;

/**
 * Renders a dashed bounding box with a label and ungroup button around each
 * group's members, positioned in flow coordinates via ViewportPortal.
 */
export function GroupOverlay() {
  const groups = useBoardStore((s) => s.groups);
  const items = useBoardStore((s) => s.items);
  const ungroupItems = useBoardStore((s) => s.ungroupItems);

  if (groups.length === 0) return null;

  return (
    <ViewportPortal>
      {groups.map((group) => {
        const members = items.filter((i) => group.itemIds.includes(i.id));
        if (members.length === 0) return null;

        const minX = Math.min(...members.map((i) => i.position.x)) - PADDING;
        const minY = Math.min(...members.map((i) => i.position.y)) - PADDING;
        const maxX = Math.max(...members.map((i) => i.position.x + i.size.width)) + PADDING;
        const maxY = Math.max(...members.map((i) => i.position.y + i.size.height)) + PADDING;

        return (
          <div
            key={group.id}
            style={{
              position: 'absolute',
              transform: `translate(${minX}px, ${minY}px)`,
              width: maxX - minX,
              height: maxY - minY,
              border: '1.5px dashed var(--secondary)',
              borderRadius: 12,
              backgroundColor: 'var(--secondary-muted)',
              pointerEvents: 'none',
            }}
          >
            <div
              className="absolute flex items-center gap-1.5"
              style={{ top: -26, left: 0, pointerEvents: 'auto' }}
            >
              <span
                className="px-2 py-0.5 rounded-md text-[11px] font-medium select-none"
                style={{ backgroundColor: 'var(--secondary)', color: '#000' }}
              >
                {group.label ?? `Group (${members.length})`}
              </span>
              <button
                className="w-5 h-5 rounded-md flex items-center justify-center cursor-pointer text-[10px]"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
                onClick={() => ungroupItems(group.id)}
                title="Ungroup (Cmd+Shift+G)"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </ViewportPortal>
  );
}
