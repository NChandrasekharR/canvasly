import { useRive } from '@rive-app/react-canvas';
import { CardWrapper } from './CardWrapper';
import { useBoardStore } from '../../store/boardStore';
import type { RiveData } from '../../types';

interface RiveCardProps {
  id: string;
  data: RiveData;
  width: number;
  height: number;
  blobUrl?: string;
}

export function RiveCard({ id, data, width, height, blobUrl }: RiveCardProps) {
  const updateItemData = useBoardStore((s) => s.updateItemData);

  const title = data.fileName ?? 'Rive Animation';
  const speed = data.speed ?? 1;

  const handleSpeedChange = (newSpeed: number) => {
    updateItemData(id, { speed: newSpeed } as Partial<RiveData>);
  };

  return (
    <CardWrapper id={id} title={title} typeIcon="~" width={width} height={height}>
      <div className="w-full h-full flex flex-col">
        <div className="flex-1 overflow-hidden">
          {blobUrl ? (
            <RiveCanvas src={blobUrl} stateMachine={data.activeStateMachine} />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Loading...
            </div>
          )}
        </div>
        <div
          className="flex items-center justify-between gap-1 py-1 px-2 shrink-0"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="flex gap-1">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                className="px-2 py-0.5 rounded text-xs cursor-pointer"
                style={{
                  backgroundColor: speed === s ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: speed === s ? 'white' : 'var(--text-secondary)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeedChange(s);
                }}
              >
                {s}x
              </button>
            ))}
          </div>
          {data.stateMachineNames && data.stateMachineNames.length > 1 && (
            <select
              className="text-xs rounded px-1 py-0.5 outline-none cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
              value={data.activeStateMachine ?? ''}
              onChange={(e) => {
                e.stopPropagation();
                updateItemData(id, {
                  activeStateMachine: e.target.value,
                } as Partial<RiveData>);
              }}
            >
              {data.stateMachineNames.map((sm) => (
                <option key={sm} value={sm}>
                  {sm}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </CardWrapper>
  );
}

function RiveCanvas({
  src,
  stateMachine,
}: {
  src: string;
  stateMachine?: string;
}) {
  const { RiveComponent } = useRive({
    src,
    stateMachines: stateMachine ? [stateMachine] : undefined,
    autoplay: true,
  });

  return <RiveComponent style={{ width: '100%', height: '100%' }} />;
}
