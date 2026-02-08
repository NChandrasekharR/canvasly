import { useCallback, useEffect, useState, useMemo } from 'react';
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
} from '@xyflow/react';
import { useBoardStore } from '../store/boardStore';
import { BoardNode } from './BoardNode';
import { AddItemMenu } from './AddItemMenu';
import { TopBar } from './TopBar';
import { BottomBar } from './BottomBar';
import { Sidebar } from './Sidebar';
import { fileToDataUrl, isImageFile, isGifFile, isVideoFile, getFileExtension } from '../utils/files';
import { parseVideoUrl } from '../utils/video';
import { saveMedia } from '../db/boardRepository';
import type { ImageItemData, VideoEmbedData, VideoUploadData, LottieData, RiveData, TextData, CodeData } from '../types';

const nodeTypes = {
  boardItem: BoardNode,
};

function CanvasInner() {
  const { items, addItem, updateItemPosition, updateItemSize, removeItem, activeBoardId, undo, redo, duplicateItems, bringToFront, sendToBack, groupItems, ungroupItems, setSearchQuery } =
    useBoardStore();
  const viewport = useViewport();
  const { screenToFlowPosition } = useReactFlow();
  const [menuState, setMenuState] = useState<{
    screen: { x: number; y: number };
    canvas: { x: number; y: number };
  } | null>(null);

  const nodes: Node[] = useMemo(
    () => {
      const result = items.map((item) => ({
        id: item.id,
        type: 'boardItem',
        position: item.position,
        data: { boardItem: item },
        style: { width: item.size.width, height: item.size.height },
        zIndex: item.zIndex,
      }));
      console.log('[Canvasly] Canvas nodes recomputed', { itemCount: items.length, nodeCount: result.length, nodes: result.map(n => ({ id: n.id, type: n.type, position: n.position })) });
      return result;
    },
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
      const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setMenuState({
        screen: { x: event.clientX, y: event.clientY },
        canvas: flowPos,
      });
    },
    [screenToFlowPosition]
  );

  const handleAddButtonClick = useCallback(
    (e: React.MouseEvent) => {
      const flowPos = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      setMenuState({
        screen: { x: e.clientX, y: e.clientY - 100 },
        canvas: flowPos,
      });
    },
    [screenToFlowPosition]
  );

  const handleFileDrop = useCallback(
    async (file: File, flowPos: { x: number; y: number }) => {
      console.log('[Canvasly] handleFileDrop called', { name: file.name, type: file.type, size: file.size, flowPos, activeBoardId });
      const ext = getFileExtension(file.name);
      console.log('[Canvasly] handleFileDrop ext:', ext);

      if (ext === 'json') {
        // Lottie JSON
        const text = await file.text();
        try {
          const animationData = JSON.parse(text);
          const data: LottieData = {
            animationData,
            speed: 1,
            fileName: file.name,
          };
          addItem('lottie', data, flowPos);
        } catch {
          // Not valid JSON, ignore
        }
      } else if (ext === 'riv') {
        // Rive file
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
        console.log('[Canvasly] handleFileDrop: matched as image/gif, converting to dataUrl...');
        const dataUrl = await fileToDataUrl(file);
        const data: ImageItemData = {
          url: dataUrl,
          fileName: file.name,
        };
        console.log('[Canvasly] handleFileDrop: calling addItem("image")', { fileName: file.name, dataUrlLength: dataUrl.length });
        addItem('image', data, flowPos);
      } else {
        console.warn('[Canvasly] handleFileDrop: file did not match any known type', { name: file.name, type: file.type, ext });
      }
    },
    [addItem, activeBoardId]
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const files = event.dataTransfer.files;
      console.log('[Canvasly] handleDrop fired', { fileCount: files.length, flowPos });
      if (files.length === 0) {
        console.warn('[Canvasly] handleDrop: no files in drop event');
      }
      for (const file of Array.from(files)) {
        console.log('[Canvasly] handleDrop: processing file', { name: file.name, type: file.type, size: file.size });
        await handleFileDrop(file, flowPos);
      }
    },
    [screenToFlowPosition, handleFileDrop]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      console.log('[Canvasly] handlePaste fired');
      const flowPos = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      const clipboardItems = event.clipboardData?.items;
      console.log('[Canvasly] handlePaste clipboardItems count:', clipboardItems?.length ?? 0);
      if (clipboardItems) {
        for (const item of Array.from(clipboardItems)) {
          console.log('[Canvasly] handlePaste item:', { kind: item.kind, type: item.type });
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            console.log('[Canvasly] handlePaste image file:', file ? { name: file.name, type: file.type, size: file.size } : null);
            if (file) {
              const dataUrl = await fileToDataUrl(file);
              const data: ImageItemData = {
                url: dataUrl,
                fileName: 'Pasted Image',
              };
              console.log('[Canvasly] handlePaste: calling addItem("image") for pasted image');
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
    [screenToFlowPosition, addItem]
  );

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  // Keyboard shortcuts
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
      } else if (meta && e.key === 'n') {
        e.preventDefault();
        // handled at app level
      }

      // Shortcuts that shouldn't fire when typing in inputs
      if (isInput) return;

      if (meta && e.key === 'd') {
        e.preventDefault();
        const selectedNodes = document.querySelectorAll('.react-flow__node.selected');
        const ids = Array.from(selectedNodes).map((n) => n.getAttribute('data-id')).filter(Boolean) as string[];
        if (ids.length > 0) duplicateItems(ids);
      } else if (meta && e.key === 'g' && !e.shiftKey) {
        e.preventDefault();
        const selectedNodes = document.querySelectorAll('.react-flow__node.selected');
        const ids = Array.from(selectedNodes).map((n) => n.getAttribute('data-id')).filter(Boolean) as string[];
        if (ids.length > 1) groupItems(ids);
      } else if (meta && e.key === 'g' && e.shiftKey) {
        e.preventDefault();
        const selectedNodes = document.querySelectorAll('.react-flow__node.selected');
        const ids = Array.from(selectedNodes).map((n) => n.getAttribute('data-id')).filter(Boolean) as string[];
        if (ids.length > 0) {
          const item = items.find((i) => ids.includes(i.id) && i.groupId);
          if (item?.groupId) ungroupItems(item.groupId);
        }
      } else if (e.key === ']') {
        const selectedNodes = document.querySelectorAll('.react-flow__node.selected');
        const ids = Array.from(selectedNodes).map((n) => n.getAttribute('data-id')).filter(Boolean) as string[];
        ids.forEach((id) => bringToFront(id));
      } else if (e.key === '[') {
        const selectedNodes = document.querySelectorAll('.react-flow__node.selected');
        const ids = Array.from(selectedNodes).map((n) => n.getAttribute('data-id')).filter(Boolean) as string[];
        ids.forEach((id) => sendToBack(id));
      } else if (e.key === 't' || e.key === 'T') {
        const flowPos = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        const data: TextData = { content: '' };
        addItem('text', data, flowPos);
      } else if (e.key === 'c' && !meta) {
        const flowPos = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        const data: CodeData = { language: 'html', code: '', showPreview: true };
        addItem('code', data, flowPos);
      } else if (e.key === 'Escape') {
        setSearchQuery('');
      }
    },
    [undo, redo, duplicateItems, groupItems, ungroupItems, bringToFront, sendToBack, addItem, screenToFlowPosition, items, setSearchQuery]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [handleKeyboard]);

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
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode="Shift"
          selectionOnDrag
          panOnDrag={[1, 2]}
          selectionMode={SelectionMode.Partial}
          fitView={false}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
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
