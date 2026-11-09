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
import { IngestError, prepareItemFromFile, stackPosition } from '../utils/ingestFile';
import { looksLikeLottiePage, parseLottieUrl } from '../utils/lottie';
import { parseVideoUrl } from '../utils/video';
import { loadVideoMetadata } from '../utils/videoMetadata';
import { showToast } from '../store/toastStore';
import type { LottieData, TextData, CodeData, VideoEmbedData } from '../types';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

const nodeTypes = {
  boardItem: BoardNode,
};

function CanvasInner() {
  const { items, addItem, updateItemPosition, updateItemPositions, removeItems, activeBoardId, undo, redo, duplicateItems, bringToFront, sendToBack, groupItems, ungroupItems, setSearchQuery, updateViewport } =
    useBoardStore();
  const theme = useBoardStore((s) => s.theme);
  const storedViewport = useBoardStore((s) => s._viewport);
  const groupDragIds = useRef<Set<string>>(new Set());
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
    // (measured dims, selection, drag position).
    setRfNodes((prevNodes) => {
      const prevMap = new Map(prevNodes.map((n) => [n.id, n]));
      return items.map((item) => {
        const prev = prevMap.get(item.id);
        const keepLivePosition = Boolean(prev?.dragging) || groupDragIds.current.has(item.id);
        return {
          ...(prev ?? {}), // preserve RF internal state (measured, selected, dragging, etc.)
          id: item.id,
          type: 'boardItem' as const,
          // During drag, keep RF's live position; otherwise use store position
          position: keepLivePosition ? (prev?.position ?? item.position) : item.position,
          data: { boardItem: item },
          width: item.size.width,
          height: item.size.height,
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
      const dragEnded = changes.some((change) => change.type === 'position' && change.dragging === false);
      if (dragEnded) groupDragIds.current.clear();

      setRfNodes((nds) => {
        const before = new Map(nds.map((node) => [node.id, node.position]));
        let next = applyNodeChanges(changes, nds);

        // While a grouped card is dragged, slide the rest of the group with it.
        const movedIds = new Set<string>();
        const groupDelta = new Map<string, { dx: number; dy: number }>();
        for (const change of changes) {
          if (change.type !== 'position' || !change.position || change.dragging !== true) continue;
          const prev = before.get(change.id);
          if (!prev) continue;
          movedIds.add(change.id);
          const item = itemsRef.current.find((candidate) => candidate.id === change.id);
          if (!item?.groupId || groupDelta.has(item.groupId)) continue;
          groupDelta.set(item.groupId, {
            dx: change.position.x - prev.x,
            dy: change.position.y - prev.y,
          });
        }
        if (groupDelta.size === 0) return next;

        const groupOf = new Map(
          itemsRef.current.flatMap((item) => (item.groupId ? [[item.id, item.groupId] as const] : []))
        );
        next = next.map((node) => {
          if (movedIds.has(node.id)) return node;
          const groupId = groupOf.get(node.id);
          const delta = groupId ? groupDelta.get(groupId) : undefined;
          if (!delta) return node;
          groupDragIds.current.add(node.id);
          return {
            ...node,
            position: { x: node.position.x + delta.dx, y: node.position.y + delta.dy },
          };
        });
        return next;
      });

      const moved: { id: string; position: { x: number; y: number } }[] = [];
      const removed: string[] = [];
      const directlyMoved = new Set<string>();
      const seenGroups = new Set<string>();
      for (const change of changes) {
        if (change.type === 'position' && change.dragging === false && change.position) {
          directlyMoved.add(change.id);
        }
        if (change.type === 'remove') removed.push(change.id);
      }
      for (const change of changes) {
        if (change.type !== 'position' || change.dragging !== false || !change.position) continue;
        moved.push({ id: change.id, position: change.position });
        const item = itemsRef.current.find((candidate) => candidate.id === change.id);
        if (!item?.groupId || seenGroups.has(item.groupId)) continue;
        seenGroups.add(item.groupId);
        const dx = change.position.x - item.position.x;
        const dy = change.position.y - item.position.y;
        if (dx === 0 && dy === 0) continue;
        for (const sibling of itemsRef.current) {
          if (sibling.groupId !== item.groupId || directlyMoved.has(sibling.id)) continue;
          moved.push({
            id: sibling.id,
            position: { x: sibling.position.x + dx, y: sibling.position.y + dy },
          });
        }
      }

      // Resizing from the left or top reports a position change with no dragging
      // flag. Persist it here so the card doesn't snap back when the size updates.
      const resizedIds = new Set(
        changes.flatMap((change) => (change.type === 'dimensions' ? [change.id] : []))
      );
      for (const change of changes) {
        if (
          change.type === 'position' &&
          change.position &&
          change.dragging == null &&
          resizedIds.has(change.id)
        ) {
          updateItemPosition(change.id, change.position);
        }
      }

      if (moved.length > 0) updateItemPositions(moved);
      if (removed.length > 0) removeItems(removed);
    },
    [updateItemPosition, updateItemPositions, removeItems]
  );

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      // onDoubleClick is attached to the React Flow wrapper, so it also sees
      // double-clicks on cards. Those belong to the card (edit a note, etc.).
      if (target.closest('.react-flow__node, .react-flow__minimap, .react-flow__panel, button, a, input, textarea, select')) {
        return;
      }
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
      if (!activeBoardId) return;
      try {
        const prepared = await prepareItemFromFile(file, activeBoardId);
        if (prepared.warning) showToast(prepared.warning, 'warning');
        addItem(prepared.type, prepared.data, flowPos);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not add file';
        showToast(message, err instanceof IngestError ? err.level : 'error');
      }
    },
    [addItem, activeBoardId]
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      const flowPos = reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const files = Array.from(event.dataTransfer.files);
      for (const [index, file] of files.entries()) {
        await handleFileDrop(file, stackPosition(flowPos, index));
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
      if (isEditableTarget(event.target)) return;

      const flowPos = reactFlow.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      const clipboardItems = event.clipboardData?.items;
      if (clipboardItems) {
        for (const item of Array.from(clipboardItems)) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              event.preventDefault();
              await handleFileDrop(file, flowPos);
              return;
            }
          }
        }
      }

      const text = event.clipboardData?.getData('text/plain')?.trim();
      if (!text) return;

      const lottieUrl = parseLottieUrl(text);
      if (lottieUrl) {
        event.preventDefault();
        const data: LottieData = { url: lottieUrl, speed: 1 };
        addItem('lottie', data, flowPos);
        return;
      }
      if (looksLikeLottiePage(text)) {
        showToast('Paste a direct .json or .lottie file URL to add a Lottie animation', 'warning');
        return;
      }

      const parsed = parseVideoUrl(text);
      if (parsed && (parsed.platform === 'youtube' || parsed.platform === 'vimeo')) {
        event.preventDefault();
        const data: VideoEmbedData = {
          url: text,
          embedUrl: parsed.embedUrl,
          platform: parsed.platform,
          thumbnailUrl: parsed.thumbnailUrl,
        };
        const id = addItem('video-embed', data, flowPos);
        loadVideoMetadata(id, text, parsed.platform);
      }
    },
    [reactFlow, addItem, handleFileDrop]
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
      const editable = isEditableTarget(e.target);
      const meta = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (meta && key === 'f') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[placeholder="Search..."]')?.focus();
        return;
      }

      // Leave undo, paste, and typing shortcuts to the focused field.
      if (editable) return;

      if (meta && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((meta && key === 'z' && e.shiftKey) || (meta && key === 'y' && !e.shiftKey)) {
        e.preventDefault();
        redo();
      } else if (meta && key === 'a') {
        e.preventDefault();
        setRfNodes((nds) => nds.map((node) => ({ ...node, selected: true })));
      } else if (meta && key === 'd') {
        e.preventDefault();
        const ids = getSelectedIds();
        if (ids.length > 0) duplicateItems(ids);
      } else if (meta && key === 'g' && !e.shiftKey) {
        e.preventDefault();
        const ids = getSelectedIds();
        if (ids.length > 1) groupItems(ids);
      } else if (meta && key === 'g' && e.shiftKey) {
        e.preventDefault();
        const ids = getSelectedIds();
        if (ids.length > 0) {
          const currentItems = itemsRef.current;
          const item = currentItems.find((i) => ids.includes(i.id) && i.groupId);
          if (item?.groupId) ungroupItems(item.groupId);
        }
      } else if (meta && key === 'n') {
        e.preventDefault();
        void (async () => {
          const id = await useBoardStore.getState().createNewBoard();
          await useBoardStore.getState().openBoard(id);
        })();
      } else if (e.key === ']') {
        const ids = getSelectedIds();
        ids.forEach((id) => bringToFront(id));
      } else if (e.key === '[') {
        const ids = getSelectedIds();
        ids.forEach((id) => sendToBack(id));
      } else if (key === 't' && !meta) {
        const flowPos = reactFlow.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        const data: TextData = { content: '' };
        addItem('text', data, flowPos);
      } else if (key === 'c' && !meta) {
        const flowPos = reactFlow.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        const data: CodeData = { language: 'html', code: '', showPreview: true };
        addItem('code', data, flowPos);
      } else if (e.key === 'Escape') {
        if (useBoardStore.getState().searchQuery) {
          setSearchQuery('');
          return;
        }
        setRfNodes((nds) => nds.map((node) => (node.selected ? { ...node, selected: false } : node)));
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
          zoomOnDoubleClick={false}
          colorMode={theme}
          fitView={false}
          defaultViewport={storedViewport}
          minZoom={0.1}
          maxZoom={4}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--border)" />
          <GroupOverlay />
          <MiniMap
            nodeColor={theme === 'light' ? '#A1A1AA' : '#3F3F46'}
            maskColor={theme === 'light' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'}
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
