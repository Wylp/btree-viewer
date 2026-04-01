import { useState, useCallback, useRef, useEffect } from 'react';

interface UsePlaybackOptions {
  totalSteps: number;
  defaultSpeed?: number;
}

interface UsePlaybackReturn {
  currentIndex: number;
  isPlaying: boolean;
  speed: number;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  first: () => void;
  last: () => void;
  goTo: (index: number) => void;
  setSpeed: (ms: number) => void;
}

export function usePlayback({ totalSteps, defaultSpeed = 800 }: UsePlaybackOptions): UsePlaybackReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(defaultSpeed);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    clearTimer();
  }, [clearTimer]);

  const play = useCallback(() => {
    if (totalSteps === 0) return;
    setIsPlaying(true);
  }, [totalSteps]);

  const next = useCallback(() => {
    setCurrentIndex(i => Math.min(i + 1, totalSteps - 1));
  }, [totalSteps]);

  const prev = useCallback(() => {
    setCurrentIndex(i => Math.max(i - 1, 0));
  }, []);

  const first = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  const last = useCallback(() => {
    setCurrentIndex(totalSteps - 1);
  }, [totalSteps]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, totalSteps - 1)));
  }, [totalSteps]);

  useEffect(() => {
    clearTimer();
    if (isPlaying && totalSteps > 0) {
      timerRef.current = setInterval(() => {
        setCurrentIndex(i => {
          if (i >= totalSteps - 1) {
            setIsPlaying(false);
            return i;
          }
          return i + 1;
        });
      }, speed);
    }
    return clearTimer;
  }, [isPlaying, speed, totalSteps, clearTimer]);

  useEffect(() => {
    setCurrentIndex(0);
    if (totalSteps > 0) {
      setIsPlaying(true);
    }
  }, [totalSteps]);

  return { currentIndex, isPlaying, speed, play, pause, next, prev, first, last, goTo, setSpeed };
}
