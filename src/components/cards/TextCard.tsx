import { useState } from 'react';
import { CardWrapper } from './CardWrapper';
import { useBoardStore } from '../../store/boardStore';
import type { TextData } from '../../types';

interface TextCardProps {
  id: string;
  data: TextData;
  width: number;
  height: number;
}

export function TextCard({ id, data, width, height }: TextCardProps) {
  const updateItemData = useBoardStore((s) => s.updateItemData);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(data.content);

  const save = () => {
    updateItemData(id, { content } as Partial<TextData>);
    setEditing(false);
  };

  return (
    <CardWrapper id={id} title="Note" typeIcon="T" width={width} height={height}>
      <div className="w-full h-full p-3 overflow-auto">
        {editing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === 'Escape') save();
            }}
            className="w-full h-full resize-none outline-none text-sm"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
            }}
            autoFocus
          />
        ) : (
          <div
            className="w-full h-full text-sm cursor-text whitespace-pre-wrap"
            style={{ color: 'var(--text-primary)' }}
            onDoubleClick={() => setEditing(true)}
          >
            {data.content || (
              <span style={{ color: 'var(--text-secondary)' }}>
                Double-click to edit...
              </span>
            )}
          </div>
        )}
      </div>
    </CardWrapper>
  );
}
