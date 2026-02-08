import { useState, useRef, useEffect } from 'react';
import { CardWrapper } from './CardWrapper';
import { useBoardStore } from '../../store/boardStore';
import type { CodeData } from '../../types';

interface CodeCardProps {
  id: string;
  data: CodeData;
  width: number;
  height: number;
}

const LANGUAGE_LABELS: Record<string, string> = {
  html: 'HTML',
  css: 'CSS',
  javascript: 'JavaScript',
  p5js: 'p5.js',
};

function buildPreviewHtml(code: string, language: string): string {
  switch (language) {
    case 'html':
      return code;
    case 'css':
      return `<!DOCTYPE html><html><head><style>${code}</style></head><body><div class="preview">Preview</div></body></html>`;
    case 'javascript':
      return `<!DOCTYPE html><html><head></head><body><script>${code}<\/script></body></html>`;
    case 'p5js':
      return `<!DOCTYPE html><html><head><script src="https://cdn.jsdelivr.net/npm/p5@1.9.0/lib/p5.min.js"><\/script></head><body><script>${code}<\/script></body></html>`;
    default:
      return code;
  }
}

export function CodeCard({ id, data, width, height }: CodeCardProps) {
  const updateItemData = useBoardStore((s) => s.updateItemData);
  const [code, setCode] = useState(data.code);
  const [previewKey, setPreviewKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!data.showPreview || !iframeRef.current) return;
    const html = buildPreviewHtml(code, data.language);
    iframeRef.current.srcdoc = html;
  }, [code, data.language, data.showPreview, previewKey]);

  const handleCodeChange = (value: string) => {
    setCode(value);
    updateItemData(id, { code: value } as Partial<CodeData>);
  };

  return (
    <CardWrapper id={id} title={`Code (${LANGUAGE_LABELS[data.language]})`} typeIcon="<>" width={width} height={height}>
      <div className="w-full h-full flex flex-col">
        {/* Toolbar */}
        <div
          className="flex items-center gap-2 px-2 py-1 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <select
            value={data.language}
            onChange={(e) =>
              updateItemData(id, { language: e.target.value } as Partial<CodeData>)
            }
            className="text-xs rounded px-1 py-0.5 outline-none cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            {Object.entries(LANGUAGE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <button
            className="text-xs px-2 py-0.5 rounded cursor-pointer"
            style={{
              backgroundColor: data.showPreview ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: data.showPreview ? 'white' : 'var(--text-secondary)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              updateItemData(id, { showPreview: !data.showPreview } as Partial<CodeData>);
            }}
          >
            Preview
          </button>
          {data.showPreview && (
            <button
              className="text-xs px-2 py-0.5 rounded cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setPreviewKey((k) => k + 1);
              }}
            >
              Run
            </button>
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Code editor */}
          <div className={`${data.showPreview ? 'w-1/2' : 'w-full'} h-full`}>
            <textarea
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full h-full p-2 resize-none outline-none text-xs"
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: '#0C0C0E',
                color: '#d4d4d4',
                borderRight: data.showPreview ? '1px solid var(--border)' : 'none',
              }}
              spellCheck={false}
            />
          </div>

          {/* Preview */}
          {data.showPreview && (
            <div className="w-1/2 h-full">
              <iframe
                ref={iframeRef}
                sandbox="allow-scripts"
                className="w-full h-full border-0"
                style={{ backgroundColor: 'white' }}
                title="Code Preview"
              />
            </div>
          )}
        </div>
      </div>
    </CardWrapper>
  );
}
