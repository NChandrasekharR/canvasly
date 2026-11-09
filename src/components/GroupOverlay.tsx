import { useStore, ViewportPortal, type Node } from '@xyflow/react';
import { useBoardStore } from '../store/boardStore';
import type { BoardItem } from '../types';

function memberBox(item: BoardItem, flowNodes: Node[]) {
  const node = flowNodes.find((candidate) => candidate.id === item.id);
  return {
    x: node?.position.x ?? item.position.x,
    y: node?.position.y ?? item.position.y,
    width: node?.measured?.width ?? item.size.width,
    height: node?.measured?.height ?? item.size.height,
  };
}

const PADDING = 14;

/**
 * Renders a dashed bounding box with a label and ungroup button around each
 * group's members, positioned in flow coordinates via ViewportPortal.
 */
export function GroupOverlay() {
  const groups = useBoardStore((s) => s.groups);
  const items = useBoardStore((s) => s.items);
  const ungroupItems = useBoardStore((s) => s.ungroupItems);
  const flowNodes = useStore((s) => s.nodes);

  if (groups.length === 0) return null;

  return (
    <ViewportPortal>
      {groups.map((group) => {
        const members = items.filter((i) => group.itemIds.includes(i.id));
        if (members.length === 0) return null;

        const boxes = members.map((member) => memberBox(member, flowNodes));
        const minX = Math.min(...boxes.map((box) => box.x)) - PADDING;
        const minY = Math.min(...boxes.map((box) => box.y)) - PADDING;
        const maxX = Math.max(...boxes.map((box) => box.x + box.width)) + PADDING;
        const maxY = Math.max(...boxes.map((box) => box.y + box.height)) + PADDING;

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
