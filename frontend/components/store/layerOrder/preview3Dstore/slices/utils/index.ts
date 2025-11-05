import * as THREE from 'three';

export const setupTexture = (image: HTMLImageElement): THREE.Texture => {
  if (!image.complete || !image.naturalWidth || !image.naturalHeight) {
    console.warn('Trying to create texture with invalid image:', {
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      src: `${image.src.substring(0, 100)}...`,
    });
  }

  const texture = new THREE.Texture(image);
  texture.format = THREE.RGBAFormat;
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  return texture;
};
