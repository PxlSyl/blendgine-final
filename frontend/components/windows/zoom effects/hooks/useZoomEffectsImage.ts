import { useEffect, useState } from 'react';
import { parseGIF, decompressFrames } from 'gifuct-js';

export const useZoomEffectsImage = (
  imageData: string | null,
  convertedImageSrc: string | null,
  staticImageData: string | null
) => {
  const [mimeType, setMimeType] = useState<string>('');
  const [isAnimatedImage, setIsAnimatedImage] = useState(false);
  const [extractedFrames, setExtractedFrames] = useState<string[]>([]);
  const [isExtractionComplete, setIsExtractionComplete] = useState(false);

  const extractGifFramesWithGifuct = (arrayBuffer: ArrayBuffer): string[] => {
    try {
      const gif = parseGIF(arrayBuffer);

      const frames = decompressFrames(gif, true);
      const frameDataUrls: string[] = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        console.error('Could not get canvas context');
        return [];
      }

      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];

        canvas.width = frame.dims.width;
        canvas.height = frame.dims.height;

        const imageData = ctx.createImageData(frame.dims.width, frame.dims.height);
        imageData.data.set(frame.patch);
        ctx.putImageData(imageData, 0, 0);

        const dataUrl = canvas.toDataURL();
        frameDataUrls.push(dataUrl);
      }

      return frameDataUrls;
    } catch (error) {
      console.error('Error extracting frames with gifuct-js:', error);
      return [];
    }
  };

  useEffect(() => {
    if (imageData) {
      const detectMimeTypeAndFrames = async () => {
        try {
          if (!convertedImageSrc) {
            return;
          }
          const response = await fetch(convertedImageSrc);
          const blob = await response.blob();
          setMimeType(blob.type);

          if (blob.type === 'image/gif') {
            const arrayBuffer = await blob.arrayBuffer();
            const frames = extractGifFramesWithGifuct(arrayBuffer);
            const animated = frames.length > 1;

            setIsAnimatedImage(animated);
            setExtractedFrames(frames);
            setIsExtractionComplete(true);
          } else if (blob.type.startsWith('video/')) {
            setIsAnimatedImage(true);
            setExtractedFrames([]);
            setIsExtractionComplete(false);
          }
        } catch (error) {
          console.error('Error detecting MIME type and frames:', error);
        }
      };

      if (!staticImageData) {
        void detectMimeTypeAndFrames();
      }
    }
  }, [imageData, convertedImageSrc, staticImageData]);

  return {
    mimeType,
    isAnimatedImage,
    extractedFrames,
    isExtractionComplete,
  };
};
