import { useState } from 'react';
import { CardWrapper } from './CardWrapper';
import { useBoardStore } from '../../store/boardStore';
import type { ColorData } from '../../types';

interface ColorCardProps {
  id: string;
  data: ColorData;
  width: number;
  height: number;
}

export function ColorCard({ id, data, width, height }: ColorCardProps) {
  const updateItemData = useBoardStore((s) => s.updateItemData);
  const [editing, setEditing] = useState(false);
  const [hex, setHex] = useState(data.hex);

  const save = () => {
    updateItemData(id, { hex } as Partial<ColorData>);
    setEditing(false);
  };

  // Determine if text should be light or dark based on background
  const isLight = (hexColor: string) => {
    const c = hexColor.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return r * 0.299 + g * 0.587 + b * 0.114 > 150;
  };

  const textColor = isLight(data.hex) ? '#000000' : '#ffffff';

  return (
    <CardWrapper id={id} title={data.label ?? data.hex} typeIcon="#" width={width} height={height}>
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer"
        style={{ backgroundColor: data.hex }}
        onClick={() => setEditing(true)}
      >
        {editing ? (
          <input
            type="color"
            value={hex}
            onChange={(e) => {
              setHex(e.target.value);
              updateItemData(id, { hex: e.target.value } as Partial<ColorData>);
            }}
            onBlur={save}
            className="w-12 h-12 cursor-pointer border-0"
            autoFocus
          />
        ) : null}
        <span className="text-sm font-mono font-medium" style={{ color: textColor }}>
          {data.hex.toUpperCase()}
        </span>
        {data.label && (
          <span className="text-xs" style={{ color: textColor, opacity: 0.8 }}>
            {data.label}
          </span>
        )}
      </div>
    </CardWrapper>
  );
}
