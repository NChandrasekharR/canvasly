import { useState, useRef, useEffect } from 'react';
import { useBoardStore } from '../store/boardStore';
import { parseVideoUrl } from '../utils/video';
import { IngestError, prepareItemFromFile, stackPosition } from '../utils/ingestFile';
import { looksLikeLottiePage, parseLottieUrl } from '../utils/lottie';
import { loadVideoMetadata } from '../utils/videoMetadata';
import { showToast } from '../store/toastStore';
import type { VideoEmbedData, TextData, CodeData, ColorData, LottieData } from '../types';

/* ─── SVG Icons ─── */
const IconUpload = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 10V2M5 5l3-3 3 3M3 12v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1"/></svg>
);
const IconLink = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 9.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5l-1 1"/><path d="M9.5 6.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1"/></svg>
);
const IconCode = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 4.5-3 3.5 3 3.5M11 4.5l3 3.5-3 3.5M9 2l-2 12"/></svg>
);
const IconText = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 3h10M8 3v10"/></svg>
);
const IconPalette = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6.5"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="10" cy="6" r="1" fill="currentColor"/><circle cx="5.5" cy="9.5" r="1" fill="currentColor"/></svg>
);
const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3 5 8l5 5"/></svg>
);

interface AddItemMenuProps {
  position: { x: number; y: number };
  canvasPosition: { x: number; y: number };
  onClose: () => void;
}

export function AddItemMenu({ position, canvasPosition, onClose }: AddItemMenuProps) {
  const addItem = useBoardStore((s) => s.addItem);
  const activeBoardId = useBoardStore((s) => s.activeBoardId);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !activeBoardId) return;
    for (const [index, file] of Array.from(files).entries()) {
      try {
        const prepared = await prepareItemFromFile(file, activeBoardId);
        if (prepared.warning) showToast(prepared.warning, 'warning');
        addItem(prepared.type, prepared.data, stackPosition(canvasPosition, index));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not add file';
        showToast(message, err instanceof IngestError ? err.level : 'error');
      }
    }
    onClose();
  };

  const handleUrlSubmit = () => {
    const url = urlValue.trim();
    if (!url) return;

    const lottieUrl = parseLottieUrl(url);
    if (lottieUrl) {
      const data: LottieData = { url: lottieUrl, speed: 1 };
      addItem('lottie', data, canvasPosition);
      onClose();
      return;
    }
    if (looksLikeLottiePage(url)) {
      showToast('Paste a direct .json or .lottie file URL to add a Lottie animation', 'warning');
      return;
    }

    const parsed = parseVideoUrl(url);
    if (parsed && (parsed.platform === 'youtube' || parsed.platform === 'vimeo')) {
      const data: VideoEmbedData = {
        url,
        embedUrl: parsed.embedUrl,
        platform: parsed.platform,
        thumbnailUrl: parsed.thumbnailUrl,
      };
      const id = addItem('video-embed', data, canvasPosition);
      loadVideoMetadata(id, url, parsed.platform);
    } else {
      showToast('URL not recognized — use a YouTube, Vimeo, or direct Lottie file link', 'warning');
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 rounded-xl py-1.5 min-w-[220px] animate-scale-in"
      style={{
        left: position.x,
        top: position.y,
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
      }}
    >
      {showUrlInput ? (
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <button
              onClick={() => setShowUrlInput(false)}
              className="w-6 h-6 rounded flex items-center justify-center cursor-pointer btn-ghost"
              style={{ color: 'var(--text-secondary)' }}
            >
              <IconArrowLeft />
            </button>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Paste URL</span>
          </div>
          <input
            type="text"
            placeholder="YouTube, Vimeo, or Lottie URL..."
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUrlSubmit();
              if (e.key === 'Escape') onClose();
            }}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
            autoFocus
          />
          <button
            onClick={handleUrlSubmit}
            className="mt-2 w-full px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
            style={{ backgroundColor: 'var(--accent)', color: '#000' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
          >
            Add
          </button>
        </div>
      ) : (
        <>
          <div className="px-3 py-1.5 mb-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Add to Canvas
            </span>
          </div>
          <MenuItem
            icon={<IconUpload />}
            label="Upload File"
            hint="Images, videos, Lottie, Rive"
            onClick={() => fileInputRef.current?.click()}
          />
          <MenuItem
            icon={<IconLink />}
            label="Paste URL"
            hint="YouTube, Vimeo, Lottie"
            onClick={() => setShowUrlInput(true)}
          />
          <div style={{ borderTop: '1px solid var(--border)', margin: '4px 8px' }} />
          <MenuItem
            icon={<IconCode />}
            label="Code Snippet"
            hint="HTML, CSS, JS, p5.js"
            onClick={() => {
              const data: CodeData = { language: 'html', code: '', showPreview: true };
              addItem('code', data, canvasPosition);
              onClose();
            }}
          />
          <MenuItem
            icon={<IconText />}
            label="Text Note"
            hint="Freeform text"
            onClick={() => {
              const data: TextData = { content: '' };
              addItem('text', data, canvasPosition);
              onClose();
            }}
          />
          <MenuItem
            icon={<IconPalette />}
            label="Color Swatch"
            hint="Palette entry"
            onClick={() => {
              const data: ColorData = { hex: '#F59E0B' };
              addItem('color', data, canvasPosition);
              onClose();
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.gif,.json,.riv"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      className="w-full text-left px-3 py-2 flex items-center gap-3 cursor-pointer transition-colors rounded-md mx-0"
      style={{ color: 'var(--text-primary)' }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      onClick={onClick}
    >
      <span className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
        {icon}
      </span>
      <div className="min-w-0">
        <span className="text-sm font-medium block">{label}</span>
        {hint && (
          <span className="text-[10px] block" style={{ color: 'var(--text-tertiary)' }}>{hint}</span>
        )}
      </div>
    </button>
  );
}
