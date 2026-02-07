import { ReactFlowProvider } from '@xyflow/react';
import { useBoardStore } from './store/boardStore';
import { Canvas } from './components/Canvas';
import { HomeView } from './components/HomeView';

function App() {
  const view = useBoardStore((s) => s.view);

  if (view === 'home') {
    return <HomeView />;
  }

  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}

export default App;
