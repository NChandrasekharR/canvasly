import { useState, useRef, useEffect } from 'react';
import { useBoardStore } from '../store/boardStore';
import { parseVideoUrl } from '../utils/video';
import { fileToDataUrl, isImageFile, isGifFile } from '../utils/files';
import type { ImageItemData, VideoEmbedData } from '../types';

interface AddItemMenuProps {
  position: { x: number; y: number };
  canvasPosition: { x: number; y: number };
  onClose: () => void;
}

export function AddItemMenu({ position, canvasPosition, onClose }: AddItemMenuProps) {
  const addItem = useBoardStore((s) => s.addItem);
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
    if (!files) return;
    for (const file of Array.from(files)) {
      const dataUrl = await fileToDataUrl(file);
      if (isGifFile(file)) {
        const data: ImageItemData = {
          url: dataUrl,
          fileName: file.name,
        };
        addItem('image', data, canvasPosition, { width: 300, height: 250 });
      } else if (isImageFile(file)) {
        const data: ImageItemData = {
          url: dataUrl,
          fileName: file.name,
        };
        addItem('image', data, canvasPosition);
      }
    }
    onClose();
  };

  const handleUrlSubmit = () => {
    const url = urlValue.trim();
    if (!url) return;

    const parsed = parseVideoUrl(url);
    if (parsed) {
      const data: VideoEmbedData = {
        url,
        embedUrl: parsed.embedUrl,
        platform: parsed.platform,
        thumbnailUrl: parsed.thumbnailUrl,
      };
      addItem('video-embed', data, canvasPosition);
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 rounded-lg shadow-xl py-1 min-w-[180px]"
      style={{
        left: position.x,
        top: position.y,
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
      }}
    >
      {showUrlInput ? (
        <div className="p-2">
          <input
            type="text"
            placeholder="Paste YouTube/Vimeo URL..."
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUrlSubmit();
              if (e.key === 'Escape') onClose();
            }}
            className="w-full px-2 py-1.5 rounded text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
            autoFocus
          />
          <button
            onClick={handleUrlSubmit}
            className="mt-1.5 w-full px-2 py-1 rounded text-sm cursor-pointer"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'white',
            }}
          >
            Add
          </button>
        </div>
      ) : (
        <>
          <MenuItem
            icon="📁"
            label="Upload File"
            onClick={() => fileInputRef.current?.click()}
          />
          <MenuItem
            icon="🔗"
            label="Paste URL"
            onClick={() => setShowUrlInput(true)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.gif"
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
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 cursor-pointer transition-colors"
      style={{ color: 'var(--text-primary)' }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = 'transparent')
      }
      onClick={onClick}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
