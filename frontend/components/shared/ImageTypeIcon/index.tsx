import React from 'react';
import { PictureIcon, VideoIcon } from '@/components/icons/imageIcons';

interface ImageInfo {
  readonly name: string;
  readonly frame_count?: number;
  readonly is_single_frame?: boolean;
}

interface ImageTypeIconProps {
  imageInfos?: ReadonlyArray<ImageInfo>;
  itemName: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackToPicture?: boolean;
}

export const ImageTypeIcon: React.FC<ImageTypeIconProps> = ({
  imageInfos,
  itemName,
  className = 'w-4 h-4 mr-2',
  style,
  fallbackToPicture = true,
}) => {
  if (!imageInfos) {
    if (fallbackToPicture) {
      return <PictureIcon className={className} style={style} />;
    }
    return null;
  }

  const possibleNames = [itemName, `${itemName}.png`, `${itemName}.gif`, `${itemName}.webp`];
  const imageInfo = imageInfos.find((info) => possibleNames.includes(info.name));

  if (!imageInfo) {
    if (fallbackToPicture) {
      return <PictureIcon className={className} style={style} />;
    }
    return null;
  }

  if (imageInfo.is_single_frame) {
    return <PictureIcon className={className} style={style} />;
  } else {
    return <VideoIcon className={className} style={style} />;
  }
};

export default ImageTypeIcon;
