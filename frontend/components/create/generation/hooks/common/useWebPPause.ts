import { useEffect, useRef } from 'react';

interface UseWebPPauseProps {
  originalSrc: string;
  isPaused: boolean;
  width: number;
  height: number;
}

export const useWebPPause = ({ originalSrc, isPaused, width, height }: UseWebPPauseProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    if (!imageRef.current) {
      imageRef.current = new Image();
      imageRef.current.src = originalSrc;
    }

    const img = imageRef.current;

    const updateCanvas = () => {
      if (isPaused) {
        ctx.drawImage(img, 0, 0, width, height);
      } else {
        ctx.clearRect(0, 0, width, height);
        img.src = originalSrc;
      }
    };

    img.onload = updateCanvas;

    if (img.complete) {
      updateCanvas();
    }

    return () => {
      img.onload = null;
    };
  }, [isPaused, originalSrc, width, height]);

  return canvasRef;
};
