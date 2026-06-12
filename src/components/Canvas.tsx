import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  MiniMap,
  SelectionMode,
  useViewport,
  useReactFlow,
  applyNodeChanges,
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
import { GroupOverlay } from './GroupOverlay';
import { isImageFile, isGifFile, isVideoFile, getFileExtension, MAX_FILE_SIZE, WARN_FILE_SIZE } from '../utils/files';
import { parseVideoUrl, getVideoDuration } from '../utils/video';
import { saveMedia } from '../db/boardRepository';
import { showToast } from '../store/toastStore';
import type { ImageItemData, VideoEmbedData, VideoUploadData, LottieData, RiveData, TextData, CodeData } from '../types';

const nodeTypes = {
  boardItem: BoardNode,
};

function CanvasInner() {
  const { items, addItem, updateItemPositions, removeItem, activeBoardId, undo, redo, duplicateItems, bringToFront, sendToBack, groupItems, ungroupItems, setSearchQuery, updateViewport } =
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

  // React Flow nodes state — kept in sync with Zustand items but preserving
  // RF internal properties (measured, selected, dragging) that RF needs to render.
  const [rfNodes, setRfNodes] = useState<Node[]>([]);

  useEffect(() => {
    // Sync external Zustand items to RF nodes, preserving RF internal state
    // (measured dims, selection, drag position). setState in effect is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRfNodes((prevNodes) => {
      const prevMap = new Map(prevNodes.map((n) => [n.id, n]));
      return items.map((item) => {
        const prev = prevMap.get(item.id);
        return {
          ...(prev ?? {}), // preserve RF internal state (measured, selected, dragging, etc.)
          id: item.id,
          type: 'boardItem' as const,
          // During drag, keep RF's live position; otherwise use store position
          position: prev?.dragging ? (prev.position ?? item.position) : item.position,
          data: { boardItem: item },
          style: { width: item.size.width, height: item.size.height },
          zIndex: item.zIndex,
        };
      });
    });
  }, [items]);

  // Apply ALL node changes from React Flow (measured dims, selection, dragging, etc.)
  // and sync user-initiated changes (drag end, remove) back to the Zustand store.
  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setRfNodes((nds) => applyNodeChanges(changes, nds));

      // Sync positions to store only on drag end, batched so a multi-select
      // drag produces a single undo entry
      const moved: { id: string; position: { x: number; y: number } }[] = [];
      for (const change of changes) {
        if (change.type === 'position' && change.dragging === false && change.position) {
          moved.push({ id: change.id, position: change.position });
        }
        if (change.type === 'remove') {
          removeItem(change.id);
        }
      }
      if (moved.length > 0) updateItemPositions(moved);
    },
    [updateItemPositions, removeItem]
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
        showToast(`"${file.name}" exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`, 'error');
        return;
      }
      if (file.size > WARN_FILE_SIZE) {
        showToast(`"${file.name}" is large (${(file.size / (1024 * 1024)).toFixed(1)}MB) — may slow saving`, 'warning');
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
          showToast(`"${file.name}" is not a valid Lottie JSON file`, 'error');
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
        const duration = await getVideoDuration(file);
        const blobId = await saveMedia(activeBoardId, file, file.name, file.type);
        const data: VideoUploadData = {
          blobId,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          duration,
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
        showToast(`Unsupported file type: "${file.name}"`, 'warning');
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
          nodes={rfNodes}
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
          <GroupOverlay />
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
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
