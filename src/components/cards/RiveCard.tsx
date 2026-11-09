import { useCallback, useEffect, useState } from 'react';
import { StateMachineInputType, useRive, type StateMachineInput } from '@rive-app/react-canvas';
import { CardWrapper } from './CardWrapper';
import { useBoardStore } from '../../store/boardStore';
import { bindPlaybackRate } from '../../utils/rivePlayback';
import type { RiveData } from '../../types';

interface RiveCardProps {
  id: string;
  data: RiveData;
  width: number;
  height: number;
  blobUrl?: string;
}

const INTERACTIVE = 'nodrag nopan nowheel';

export function RiveCard({ id, data, width, height, blobUrl }: RiveCardProps) {
  const updateItemData = useBoardStore((s) => s.updateItemData);

  const title = data.fileName ?? 'Rive Animation';
  const speed = data.speed ?? 1;

  const handleSpeedChange = (newSpeed: number) => {
    updateItemData(id, { speed: newSpeed } as Partial<RiveData>);
  };

  const handleStateMachines = useCallback((names: string[]) => {
    const item = useBoardStore.getState().items.find((candidate) => candidate.id === id);
    if (!item || item.type !== 'rive') return;
    const current = item.data as RiveData;
    const existing = current.stateMachineNames ?? [];
    const sameNames = existing.length === names.length && existing.every((name, index) => name === names[index]);
    const active =
      current.activeStateMachine && names.includes(current.activeStateMachine)
        ? current.activeStateMachine
        : names[0];
    if (sameNames && current.activeStateMachine === active) return;
    useBoardStore.getState().updateItemData(id, {
      stateMachineNames: names,
      activeStateMachine: active,
    } as Partial<RiveData>);
  }, [id]);

  return (
    <CardWrapper id={id} title={title} typeIcon="~" width={width} height={height}>
      <div className="w-full h-full flex flex-col">
        <div className="flex-1 overflow-hidden">
          {blobUrl ? (
            <RiveCanvas
              key={blobUrl}
              src={blobUrl}
              stateMachine={data.activeStateMachine}
              speed={speed}
              onStateMachines={handleStateMachines}
            />
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
          className={`${INTERACTIVE} flex items-center justify-between gap-1 py-1 px-2 shrink-0`}
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="flex gap-1">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                className={`${INTERACTIVE} px-2 py-0.5 rounded text-xs cursor-pointer`}
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
              className={`${INTERACTIVE} text-xs rounded px-1 py-0.5 outline-none cursor-pointer`}
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
  speed,
  onStateMachines,
}: {
  src: string;
  stateMachine?: string;
  speed: number;
  onStateMachines: (names: string[]) => void;
}) {
  const { rive, RiveComponent } = useRive({
    src,
    stateMachines: stateMachine,
    autoplay: true,
  });
  const [inputs, setInputs] = useState<StateMachineInput[]>([]);

  useEffect(() => {
    if (!rive) return;
    return bindPlaybackRate(rive, () => speed);
  }, [rive, speed]);

  useEffect(() => {
    if (!rive) return;
    let cancelled = false;
    const names = rive.stateMachineNames ?? [];
    if (names.length > 0) onStateMachines(names);

    const target = stateMachine && names.includes(stateMachine) ? stateMachine : names[0];
    // useRive only reads stateMachines on first load, and with none given it
    // plays a linear animation instead of the interactive state machine.
    if (target && !rive.playingStateMachineNames.includes(target)) {
      rive.reset({ stateMachines: target, autoplay: true });
      rive.play(target);
    }
    queueMicrotask(() => {
      if (cancelled) return;
      setInputs(target ? (rive.stateMachineInputs(target) ?? []) : []);
    });
    return () => {
      cancelled = true;
    };
  }, [rive, stateMachine, onStateMachines]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <RiveComponent className={INTERACTIVE} style={{ width: '100%', height: '100%' }} />
      </div>
      {inputs.length > 0 && <StateMachineControls inputs={inputs} />}
    </div>
  );
}

function StateMachineControls({ inputs }: { inputs: StateMachineInput[] }) {
  const [, redraw] = useState(0);

  return (
    <div className={`${INTERACTIVE} flex flex-wrap gap-1 px-1.5 py-1`} style={{ borderTop: '1px solid var(--border)' }}>
      {inputs.map((input) => {
        if (input.type === StateMachineInputType.Trigger) {
          return (
            <button
              key={input.name}
              className={`${INTERACTIVE} px-1.5 py-0.5 rounded text-[10px] cursor-pointer`}
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                input.fire();
              }}
            >
              {input.name}
            </button>
          );
        }
        if (input.type === StateMachineInputType.Boolean) {
          const on = Boolean(input.value);
          return (
            <button
              key={input.name}
              className={`${INTERACTIVE} px-1.5 py-0.5 rounded text-[10px] cursor-pointer`}
              style={{
                backgroundColor: on ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: on ? '#000' : 'var(--text-secondary)',
              }}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                input.value = !input.value;
                redraw((n) => n + 1);
              }}
            >
              {input.name}
            </button>
          );
        }
        return (
          <label
            key={input.name}
            className={`${INTERACTIVE} flex items-center gap-1 text-[10px]`}
            style={{ color: 'var(--text-secondary)' }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {input.name}
            <input
              type="number"
              className={`${INTERACTIVE} w-12 rounded px-1 py-0.5 outline-none`}
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
              value={Number(input.value)}
              onChange={(event) => {
                input.value = Number(event.target.value);
                redraw((n) => n + 1);
              }}
            />
          </label>
        );
      })}
    </div>
  );
}
