import { useEffect, useRef } from 'react';

export const useZoomEffectsAnimation = (
  isAnimatedImage: boolean,
  isPlaying: boolean,
  maxFrames: number,
  fps: number,
  extractedFrames: string[],
  isExtractionComplete: boolean,
  currentFrame: number,
  setCurrentFrame: (frame: number | ((prev: number) => number)) => void,
  setStaticImageData: (data: string | null) => void
) => {
  const lastFrameTime = useRef(performance.now());
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAnimatedImage || !isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      const frameInterval = 1000 / fps;
      if (timestamp - lastFrameTime.current >= frameInterval) {
        setCurrentFrame((prev) => (prev + 1) % maxFrames);
        lastFrameTime.current = timestamp;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimatedImage, fps, maxFrames, isPlaying, setCurrentFrame]);

  useEffect(() => {
    if (
      !isPlaying &&
      isExtractionComplete &&
      extractedFrames.length > 0 &&
      currentFrame < extractedFrames.length
    ) {
      setStaticImageData(extractedFrames[currentFrame]);
    }
  }, [currentFrame, isPlaying, isExtractionComplete, extractedFrames, setStaticImageData]);

  return {
    animationRef,
  };
};
