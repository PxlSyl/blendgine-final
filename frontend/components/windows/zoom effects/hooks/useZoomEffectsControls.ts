import { useState, useRef } from 'react';

export const useZoomEffectsControls = (
  maxFrames: number,
  fps: number,
  mimeType: string,
  isAnimatedImage: boolean,
  isExtractionComplete: boolean,
  extractedFrames: string[],
  currentFrame: number,
  setCurrentFrame: (frame: number | ((prev: number) => number)) => void,
  setConvertedImageSrc: (src: string) => void,
  setTitle: (title: string) => void
) => {
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentFrameState, setCurrentFrameState] = useState(0);
  const [maxFramesState, setMaxFramesState] = useState(1);
  const [fpsState, setFpsState] = useState(24);
  const [staticImageData, setStaticImageDataState] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prevZoom) => Math.max(0.5, Math.min(9, prevZoom + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleZoomIn = () => {
    setZoom((prevZoom) => Math.min(9, prevZoom + 0.1));
  };

  const handleZoomOut = () => {
    setZoom((prevZoom) => Math.max(0.5, prevZoom - 0.1));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setConvertedImageSrc(img.src);
    setTitle(img.alt || 'Image');
  };

  const handleVideoLoad = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    setConvertedImageSrc(video.src);

    if (video.duration > 0 && 'requestVideoFrameCallback' in video) {
      let frameCount = 0;
      let startTime = 0;
      let fpsDetectionComplete = false;

      const detectFPS = () => {
        if (fpsDetectionComplete) {
          return;
        }

        frameCount++;
        if (frameCount === 1) {
          startTime = performance.now();
        }

        if (frameCount < 60) {
          video.requestVideoFrameCallback(detectFPS);
        } else {
          const elapsed = (performance.now() - startTime) / 1000;
          const actualFps = frameCount / elapsed;
          fpsDetectionComplete = true;

          const totalFrames = Math.floor(video.duration * actualFps);
          setMaxFramesState(totalFrames);
          setFpsState(actualFps);
        }
      };

      video.requestVideoFrameCallback(detectFPS);
    }
  };

  const togglePlayPause = () => {
    const newIsPlaying = !isPlaying;

    setIsPlaying(newIsPlaying);

    if (mimeType.startsWith('video/') && videoRef.current) {
      if (newIsPlaying) {
        void videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
      return;
    }

    if (!newIsPlaying && isAnimatedImage && maxFrames > 1) {
      if (
        isExtractionComplete &&
        extractedFrames.length > 0 &&
        currentFrame < extractedFrames.length
      ) {
        setStaticImageDataState(extractedFrames[currentFrame]);
      } else {
        createStaticCopy();
      }
    } else if (newIsPlaying) {
      setStaticImageDataState(null);
    }
  };

  const createStaticCopy = () => {
    if (!imgRef.current) {
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('createStaticCopy: Could not get canvas context');
      return;
    }

    canvas.width = imgRef.current.naturalWidth;
    canvas.height = imgRef.current.naturalHeight;
    ctx.drawImage(imgRef.current, 0, 0);

    const staticDataUrl = canvas.toDataURL();
    setStaticImageDataState(staticDataUrl);
  };

  const handleNextFrame = () => {
    if (maxFrames <= 1) {
      return;
    }

    if (mimeType.startsWith('video/') && videoRef.current) {
      const newTime = videoRef.current.currentTime + 1 / fps;
      if (newTime < videoRef.current.duration) {
        videoRef.current.currentTime = newTime;
      }
      return;
    }

    setCurrentFrame((prev) => {
      const newFrame = (prev + 1) % maxFrames;

      if (
        !isPlaying &&
        isExtractionComplete &&
        extractedFrames.length > 0 &&
        newFrame < extractedFrames.length
      ) {
        setStaticImageDataState(extractedFrames[newFrame]);
      }

      return newFrame;
    });
  };

  const handlePreviousFrame = () => {
    if (maxFrames <= 1) {
      return;
    }

    if (mimeType.startsWith('video/') && videoRef.current) {
      const newTime = Math.max(0, videoRef.current.currentTime - 1 / fps);
      videoRef.current.currentTime = newTime;
      return;
    }

    setCurrentFrame((prev) => {
      const newFrame = (prev - 1 + maxFrames) % maxFrames;
      if (
        !isPlaying &&
        isExtractionComplete &&
        extractedFrames.length > 0 &&
        newFrame < extractedFrames.length
      ) {
        setStaticImageDataState(extractedFrames[newFrame]);
      }

      return newFrame;
    });
  };

  return {
    zoom,
    isDragging,
    position,
    isPlaying,
    currentFrame: currentFrameState,
    maxFrames: maxFramesState,
    fps: fpsState,
    staticImageData,
    imgRef,
    videoRef,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleContextMenu,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleImageLoad,
    handleVideoLoad,
    togglePlayPause,
    handleNextFrame,
    handlePreviousFrame,
    setCurrentFrame: setCurrentFrameState,
    setStaticImageData: setStaticImageDataState,
  };
};
