import { useState, useRef, useMemo } from 'react';

export const useCanvasState = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const containerSize = useMemo(() => {
    const minSize = 300;
    const maxSize = 600;
    const screenWidth = window.innerWidth;

    const baseSize = Math.min(maxSize, Math.max(minSize, screenWidth * 0.4));

    if (screenWidth < 640) {
      return Math.min(maxSize, Math.max(minSize, screenWidth * 0.6));
    }

    return baseSize;
  }, []);

  const padding = 20;
  const maxSize = containerSize - padding;

  return {
    containerRef,
    animationRef,
    sliderPosition,
    setSliderPosition,
    isDragging,
    setIsDragging,
    maxSize,
  };
};
