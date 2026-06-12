import { lazy, Suspense } from 'react';
import { useBoardStore } from './store/boardStore';
import { HomeView } from './components/HomeView';

// Lazy-load the canvas so xyflow/lottie/rive only download when a board is opened
const Canvas = lazy(() =>
  import('./components/Canvas').then((m) => ({ default: m.Canvas }))
);

function App() {
  const view = useBoardStore((s) => s.view);
  const activeBoardId = useBoardStore((s) => s.activeBoardId);

  if (view === 'home') {
    return <HomeView />;
  }

  return (
    <Suspense
      fallback={
        <div
          className="h-full w-full flex items-center justify-center text-sm"
          style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
        >
          Loading board...
        </div>
      }
    >
      {/* Key by board so ReactFlow remounts and restores the saved viewport per board */}
      <Canvas key={activeBoardId ?? 'none'} />
    </Suspense>
  );
}

export default App;
