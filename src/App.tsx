import { ReactFlowProvider } from '@xyflow/react';
import { Canvas } from './components/Canvas';

function App() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}

export default App;
