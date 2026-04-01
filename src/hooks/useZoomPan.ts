import { useState, useCallback, useRef, type MouseEvent, type WheelEvent } from 'react';

interface ZoomPanState {
  scale: number;
  translateX: number;
  translateY: number;
}

interface UseZoomPanReturn {
  state: ZoomPanState;
  onWheel: (e: WheelEvent) => void;
  onMouseDown: (e: MouseEvent) => void;
  onMouseMove: (e: MouseEvent) => void;
  onMouseUp: () => void;
  resetView: () => void;
  transformStyle: string;
}

export function useZoomPan(): UseZoomPanReturn {
  const [state, setState] = useState<ZoomPanState>({
    scale: 1, translateX: 0, translateY: 0,
  });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setState(s => ({
      ...s,
      scale: Math.max(0.1, Math.min(5, s.scale * delta)),
    }));
  }, []);

  const onMouseDown = useCallback((e: MouseEvent) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setState(s => ({
      ...s,
      translateX: s.translateX + dx,
      translateY: s.translateY + dy,
    }));
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const resetView = useCallback(() => {
    setState({ scale: 1, translateX: 0, translateY: 0 });
  }, []);

  const transformStyle = `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;

  return { state, onWheel, onMouseDown, onMouseMove, onMouseUp, resetView, transformStyle };
}
