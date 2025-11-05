/**
 * Utility functions for image handling
 */

/**
 * Get the MIME type for an image file based on its extension
 * @param imageName - The image filename with extension
 * @returns The corresponding MIME type string
 */
export const getImageMimeType = (imageName: string): string => {
  const extension = imageName.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'png':
    default:
      return 'image/png';
  }
};

/**
 * Get the file path for an image
 * @param imagePath - The image file path
 * @returns The file path
 */
export const getImagePath = (imagePath: string): string => {
  return imagePath;
};

/**
 * Check if a file is a supported image format
 * @param fileName - The filename to check
 * @returns True if the file is a supported image format
 */
export const isSupportedImageFormat = (fileName: string): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return ['png', 'webp', 'gif', 'mp4', 'webm'].includes(extension ?? '');
};

/**
 * Get the list of supported image extensions
 * @returns Array of supported image extensions
 */
export const getSupportedImageExtensions = (): string[] => {
  return ['png', 'webp', 'gif', 'mp4', 'webm'];
};

/**
 * Generate possible image names with supported extensions
 * @param baseName - The base name without extension
 * @returns Array of possible image names with extensions
 */
export const getPossibleImageNames = (baseName: string): string[] => {
  return getSupportedImageExtensions().map((ext) => `${baseName}.${ext}`);
};
