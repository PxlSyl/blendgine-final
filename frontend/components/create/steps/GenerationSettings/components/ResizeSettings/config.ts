export const resizeAlgorithms = [
  'CONVOLUTION',
  'INTERPOLATION',
  'NEAREST',
  'SUPERSAMPLING',
] as const;
export const resizeFilters = [
  'BICUBIC',
  'BILINEAR',
  'GAUSSIAN',
  'HAMMING',
  'LANCZOS',
  'MITCHELL',
  'NEAREST',
] as const;

export const getAlgorithmDisplayName = (algorithm: string): string => {
  switch (algorithm) {
    case 'CONVOLUTION':
      return 'Convolution';
    case 'INTERPOLATION':
      return 'Interpolation';
    case 'NEAREST':
      return 'Nearest';
    case 'SUPERSAMPLING':
      return 'Super Sampling';
    default:
      return algorithm;
  }
};

export const getFilterDisplayName = (filter: string): string => {
  switch (filter) {
    case 'BICUBIC':
      return 'Bicubic';
    case 'BILINEAR':
      return 'Bilinear';
    case 'GAUSSIAN':
      return 'Gaussian';
    case 'HAMMING':
      return 'Hamming';
    case 'LANCZOS':
      return 'Lanczos';
    case 'MITCHELL':
      return 'Mitchell';
    case 'NEAREST':
      return 'Nearest';
    default:
      return filter;
  }
};

export const getFilterDescription = (filter: string): string => {
  switch (filter) {
    case 'NEAREST':
      return 'Perfect for pixel art and retro-style images. Maintains sharp edges and pixel-perfect look, but may appear blocky on organic shapes.';
    case 'BILINEAR':
      return 'Good balance between quality and speed. Smoother than nearest neighbor but may slightly blur pixel art. Ideal for UI graphics and simple images.';
    case 'BICUBIC':
      return 'High quality resizing with sharper results than bilinear. Good for most images, especially those with text or detailed graphics. More CPU intensive.';
    case 'LANCZOS':
      return 'Highest quality resizing algorithm. Best for photographic content and complex images. Preserves sharpness and detail but most CPU intensive.';
    case 'HAMMING':
      return 'Intermediate quality between bilinear and bicubic. Good balance of speed and quality. Suitable for most images with moderate detail.';
    case 'MITCHELL':
      return 'Excellent quality resizing algorithm. Better than bicubic for reducing aliasing artifacts. Ideal for high-quality images with fine details.';
    case 'GAUSSIAN':
      return 'High-quality Gaussian filter with standard deviation of 0.5. Excellent for downscaling, produces smooth results with minimal artifacts. Best for photographic content.';
    default:
      return 'Good balance of quality and speed. Suitable for most images.';
  }
};

export const getAlgorithmDescription = (algorithm: string, filter?: string): string => {
  const filterName = filter ? getFilterDisplayName(filter) : 'Bilinear';

  switch (algorithm) {
    case 'NEAREST':
      return 'Nearest neighbor - Very fast, perfect for pixel art and retro-style images. Maintains sharp edges but may appear blocky.';
    case 'CONVOLUTION':
      return `Convolution with ${filterName} filter - High-quality resizing with customizable filters. ${getFilterDescription(filter ?? 'BILINEAR')}`;
    case 'INTERPOLATION':
      return `Interpolation with ${filterName} filter - Fixed kernel size algorithm similar to OpenCV. ${getFilterDescription(filter ?? 'BILINEAR')}`;
    case 'SUPERSAMPLING':
      return `Super sampling with ${filterName} filter - Highest quality resizing for complex images. Most CPU intensive but produces excellent results. ${getFilterDescription(filter ?? 'BILINEAR')}`;
    default:
      return 'Select a resize algorithm to see its detailed description.';
  }
};
