import { useEffect } from 'react';

interface UseCanvasEventsProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  setSliderPosition: (position: number) => void;
}

export const useCanvasEvents = ({
  containerRef,
  isDragging,
  setIsDragging,
  setSliderPosition,
}: UseCanvasEventsProps) => {
  const updateSliderPosition = (e: React.MouseEvent) => {
    if (!containerRef.current) {
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(percentage, 0), 100));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) {
      return;
    }
    setIsDragging(true);
    updateSliderPosition(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) {
      return;
    }
    updateSliderPosition(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [setIsDragging]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};
