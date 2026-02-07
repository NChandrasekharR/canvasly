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
import { fileToDataUrl, isImageFile, isGifFile } from '../utils/files';
import { parseVideoUrl } from '../utils/video';
import type { ImageItemData, VideoEmbedData } from '../types';

const nodeTypes = {
  boardItem: BoardNode,
};

function CanvasInner() {
  const { items, addItem, updateItemPosition, updateItemSize, removeItem } = useBoardStore();
  const viewport = useViewport();
  const { screenToFlowPosition } = useReactFlow();
  const [menuState, setMenuState] = useState<{
    screen: { x: number; y: number };
    canvas: { x: number; y: number };
  } | null>(null);
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

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });

      const files = event.dataTransfer.files;
      for (const file of Array.from(files)) {
        if (isGifFile(file) || isImageFile(file)) {
          const dataUrl = await fileToDataUrl(file);
          const data: ImageItemData = {
            url: dataUrl,
            fileName: file.name,
          };
          addItem('image', data, flowPos);
        }
      }
    },
    [screenToFlowPosition, addItem]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  // Clipboard paste support
  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      const flowPos = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      // Check for pasted images
      const clipboardItems = event.clipboardData?.items;
      if (clipboardItems) {
        for (const item of Array.from(clipboardItems)) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              const dataUrl = await fileToDataUrl(file);
              const data: ImageItemData = {
                url: dataUrl,
                fileName: 'Pasted Image',
              };
              addItem('image', data, flowPos);
              return;
            }
          }
        }
      }

      // Check for pasted URLs
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

  // Register paste handler
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  return (
    <div className="w-full h-full relative">
      <TopBar boardName="Untitled Board" />
      <div
        className="absolute inset-0"
        style={{ top: 40, bottom: 32 }}
      >
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
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="#333333"
          />
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
