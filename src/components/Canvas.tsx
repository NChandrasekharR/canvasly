import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  SelectionMode,
  useViewport,
  useReactFlow,
  type Node,
  type NodeChange,
  type OnNodesChange,
  type Viewport,
} from '@xyflow/react';
import { useBoardStore } from '../store/boardStore';
import { BoardNode } from './BoardNode';
import { AddItemMenu } from './AddItemMenu';
import { TopBar } from './TopBar';
import { BottomBar } from './BottomBar';
import { Sidebar } from './Sidebar';
import { isImageFile, isGifFile, isVideoFile, getFileExtension, MAX_FILE_SIZE, WARN_FILE_SIZE } from '../utils/files';
import { parseVideoUrl } from '../utils/video';
import { saveMedia } from '../db/boardRepository';
import type { ImageItemData, VideoEmbedData, VideoUploadData, LottieData, RiveData, TextData, CodeData } from '../types';

const nodeTypes = {
  boardItem: BoardNode,
};

function CanvasInner() {
  const { items, addItem, updateItemPosition, updateItemSize, removeItem, activeBoardId, undo, redo, duplicateItems, bringToFront, sendToBack, groupItems, ungroupItems, setSearchQuery, updateViewport } =
    useBoardStore();
  const storedViewport = useBoardStore((s) => s._viewport);
  const viewport = useViewport();
  const reactFlow = useReactFlow();
  const [menuState, setMenuState] = useState<{
    screen: { x: number; y: number };
    canvas: { x: number; y: number };
  } | null>(null);

  // Ref for items so keyboard handler doesn't depend on items array
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const nodes: Node[] = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        type: 'boardItem',
        position: item.position,
        data: { boardItem: item },
        style: { width: item.size.width, height: item.size.height },
        zIndex: item.zIndex,
      })),
    [items]
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          updateItemPosition(change.id, change.position);
        }
        if (change.type === 'dimensions' && change.dimensions) {
          updateItemSize(change.id, {
            width: change.dimensions.width,
            height: change.dimensions.height,
          });
        }
        if (change.type === 'remove') {
          removeItem(change.id);
        }
      }
    },
    [updateItemPosition, updateItemSize, removeItem]
  );

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const flowPos = reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setMenuState({
        screen: { x: event.clientX, y: event.clientY },
        canvas: flowPos,
      });
    },
    [reactFlow]
  );

  const handleAddButtonClick = useCallback(
    (e: React.MouseEvent) => {
      const flowPos = reactFlow.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      setMenuState({
        screen: { x: e.clientX, y: e.clientY - 100 },
        canvas: flowPos,
      });
    },
    [reactFlow]
  );

  const handleFileDrop = useCallback(
    async (file: File, flowPos: { x: number; y: number }) => {
      // File size validation
      if (file.size > MAX_FILE_SIZE) {
        console.warn(`[Canvasly] File "${file.name}" exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit, skipping`);
        return;
      }
      if (file.size > WARN_FILE_SIZE) {
        console.warn(`[Canvasly] File "${file.name}" is large (${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
      }

      const ext = getFileExtension(file.name);

      if (ext === 'json') {
        // Lottie JSON
        try {
          const text = await file.text();
          const animationData = JSON.parse(text);
          const data: LottieData = {
            animationData,
            speed: 1,
            fileName: file.name,
          };
          addItem('lottie', data, flowPos);
        } catch {
          console.warn('[Canvasly] Failed to parse JSON file as Lottie animation');
        }
      } else if (ext === 'riv') {
        if (!activeBoardId) return;
        const blobId = await saveMedia(activeBoardId, file, file.name, 'application/octet-stream');
        const data: RiveData = {
          blobId,
          fileName: file.name,
          fileSize: file.size,
          speed: 1,
        };
        addItem('rive', data, flowPos);
      } else if (isVideoFile(file)) {
        if (!activeBoardId) return;
        const blobId = await saveMedia(activeBoardId, file, file.name, file.type);
        const data: VideoUploadData = {
          blobId,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        };
        addItem('video-upload', data, flowPos);
      } else if (isGifFile(file) || isImageFile(file)) {
        if (!activeBoardId) return;
        const blobId = await saveMedia(activeBoardId, file, file.name, file.type || 'image/png');
        const data: ImageItemData = {
          blobId,
          fileName: file.name,
        };
        addItem('image', data, flowPos);
      } else {
        console.warn('[Canvasly] Unsupported file type:', file.name);
      }
    },
    [addItem, activeBoardId]
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      const flowPos = reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const files = event.dataTransfer.files;
      for (const file of Array.from(files)) {
        await handleFileDrop(file, flowPos);
      }
    },
    [reactFlow, handleFileDrop]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      const flowPos = reactFlow.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      const clipboardItems = event.clipboardData?.items;
      if (clipboardItems) {
        for (const item of Array.from(clipboardItems)) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file && activeBoardId) {
              const blobId = await saveMedia(activeBoardId, file, 'Pasted Image', file.type);
              const data: ImageItemData = {
                blobId,
                fileName: 'Pasted Image',
              };
              addItem('image', data, flowPos);
              return;
            }
          }
        }
      }

      const text = event.clipboardData?.getData('text/plain')?.trim();
      if (text) {
        const parsed = parseVideoUrl(text);
        if (parsed) {
          const data: VideoEmbedData = {
            url: text,
            embedUrl: parsed.embedUrl,
            platform: parsed.platform,
            thumbnailUrl: parsed.thumbnailUrl,
          };
          addItem('video-embed', data, flowPos);
        }
      }
    },
    [reactFlow, addItem, activeBoardId]
  );

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  // Helper: get selected node IDs using React Flow API (not DOM queries)
  const getSelectedIds = useCallback((): string[] => {
    return reactFlow.getNodes().filter((n) => n.selected).map((n) => n.id);
  }, [reactFlow]);

  // Keyboard shortcuts — uses refs/API to avoid recreating on every item change
  const handleKeyboard = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (meta && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (meta && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('input[placeholder="Search..."]');
        searchInput?.focus();
      }

      // Shortcuts that shouldn't fire when typing in inputs
      if (isInput) return;

      if (meta && e.key === 'd') {
        e.preventDefault();
        const ids = getSelectedIds();
        if (ids.length > 0) duplicateItems(ids);
      } else if (meta && e.key === 'g' && !e.shiftKey) {
        e.preventDefault();
        const ids = getSelectedIds();
        if (ids.length > 1) groupItems(ids);
      } else if (meta && e.key === 'g' && e.shiftKey) {
        e.preventDefault();
        const ids = getSelectedIds();
        if (ids.length > 0) {
          const currentItems = itemsRef.current;
          const item = currentItems.find((i) => ids.includes(i.id) && i.groupId);
          if (item?.groupId) ungroupItems(item.groupId);
        }
      } else if (e.key === ']') {
        const ids = getSelectedIds();
        ids.forEach((id) => bringToFront(id));
      } else if (e.key === '[') {
        const ids = getSelectedIds();
        ids.forEach((id) => sendToBack(id));
      } else if (e.key === 't' || e.key === 'T') {
        const flowPos = reactFlow.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        const data: TextData = { content: '' };
        addItem('text', data, flowPos);
      } else if (e.key === 'c' && !meta) {
        const flowPos = reactFlow.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        const data: CodeData = { language: 'html', code: '', showPreview: true };
        addItem('code', data, flowPos);
      } else if (e.key === 'Escape') {
        setSearchQuery('');
      }
    },
    [undo, redo, duplicateItems, groupItems, ungroupItems, bringToFront, sendToBack, addItem, reactFlow, getSelectedIds, setSearchQuery]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [handleKeyboard]);

  // Persist viewport on pan/zoom end
  const handleMoveEnd = useCallback(
    (_event: MouseEvent | TouchEvent | null, vp: Viewport) => {
      updateViewport({ x: vp.x, y: vp.y, zoom: vp.zoom });
    },
    [updateViewport]
  );

  return (
    <div className="w-full h-full relative">
      <TopBar />
      <Sidebar />
      <div className="absolute inset-0" style={{ top: 48, bottom: 36 }}>
        <ReactFlow
          nodes={nodes}
          edges={[]}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onDoubleClick={handleDoubleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onMoveEnd={handleMoveEnd}
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode="Shift"
          selectionOnDrag
          panOnDrag={[1, 2]}
          selectionMode={SelectionMode.Partial}
          fitView={false}
          defaultViewport={storedViewport}
          minZoom={0.1}
          maxZoom={4}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--border)" />
          <MiniMap
            nodeColor="var(--bg-tertiary)"
            maskColor="rgba(0,0,0,0.5)"
            position="bottom-right"
            style={{ marginBottom: 8, marginRight: 8 }}
          />
        </ReactFlow>
      </div>
      <BottomBar zoom={viewport.zoom} onAddClick={handleAddButtonClick} />

      {menuState && (
        <AddItemMenu
          position={menuState.screen}
          canvasPosition={menuState.canvas}
          onClose={() => setMenuState(null)}
        />
      )}
    </div>
  );
}

export function Canvas() {
  return <CanvasInner />;
}
