import { useState, useCallback, useRef, useMemo } from 'react';
import { BTree } from './engine/BTree';
import { resetIdCounter } from './engine/BTreeNode';
import type { Step } from './engine/types';
import { Toolbar } from './components/Toolbar';
import { TreeCanvas } from './components/TreeCanvas';
import { Sidebar } from './components/Sidebar';
import { usePlayback } from './hooks/usePlayback';
import { colors } from './styles/theme';

export default function App() {
  const [order, setOrder] = useState(3);
  const treeRef = useRef(new BTree(order));
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepsVersion, setStepsVersion] = useState(0);

  const playback = usePlayback({ totalSteps: steps.length });

  const currentStep = steps.length > 0 ? steps[playback.currentIndex] ?? null : null;

  const displaySnapshot = useMemo(() => {
    if (currentStep) return currentStep.treeSnapshot;
    return treeRef.current.root;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, stepsVersion]);

  const runOperation = useCallback((op: (tree: BTree) => Step[]) => {
    const newSteps = op(treeRef.current);
    setSteps(newSteps);
    setStepsVersion(v => v + 1);
  }, []);

  const handleInsert = useCallback((key: number) => {
    runOperation(tree => tree.insert(key));
  }, [runOperation]);

  const handleDelete = useCallback((key: number) => {
    runOperation(tree => tree.delete(key));
  }, [runOperation]);

  const handleSearch = useCallback((key: number) => {
    runOperation(tree => tree.search(key));
  }, [runOperation]);

  const handleBulkInsert = useCallback((keys: number[]) => {
    runOperation(tree => tree.bulkInsert(keys));
  }, [runOperation]);

  const handleOrderChange = useCallback((newOrder: number) => {
    resetIdCounter();
    treeRef.current = new BTree(newOrder);
    setOrder(newOrder);
    setSteps([]);
    setStepsVersion(v => v + 1);
  }, []);

  const handleClear = useCallback(() => {
    resetIdCounter();
    treeRef.current = new BTree(order);
    setSteps([]);
    setStepsVersion(v => v + 1);
  }, [order]);

  return (
    <div
      id="app"
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 8,
        background: colors.bgPrimary,
      }}
    >
      <Toolbar
        order={order}
        onInsert={handleInsert}
        onDelete={handleDelete}
        onSearch={handleSearch}
        onBulkInsert={handleBulkInsert}
        onOrderChange={handleOrderChange}
        onClear={handleClear}
        hasTree={treeRef.current.root !== null}
      />

      <div style={{ flex: 1, display: 'flex', gap: 8, minHeight: 0 }}>
        <TreeCanvas
          snapshot={displaySnapshot}
          currentStep={currentStep}
        />
        <Sidebar
          steps={steps}
          currentIndex={playback.currentIndex}
          isPlaying={playback.isPlaying}
          speed={playback.speed}
          onPlay={playback.play}
          onPause={playback.pause}
          onNext={playback.next}
          onPrev={playback.prev}
          onFirst={playback.first}
          onLast={playback.last}
          onGoTo={playback.goTo}
          onSpeedChange={playback.setSpeed}
        />
      </div>
    </div>
  );
}
