/** Hard limit: reject files larger than 100MB */
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/** Warn threshold: files larger than 50MB */
export const WARN_FILE_SIZE = 50 * 1024 * 1024;

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export function isImageFile(file: File): boolean {
  const byMime = /^image\/(png|jpe?g|webp|svg\+xml|gif)$/.test(file.type);
  const byExt = /^(png|jpe?g|webp|svg|gif)$/.test(getFileExtension(file.name));
  return byMime || byExt;
}

export function isGifFile(file: File): boolean {
  return file.type === 'image/gif' || getFileExtension(file.name) === 'gif';
}

export function isVideoFile(file: File): boolean {
  const byMime = /^video\/(mp4|webm|quicktime)$/.test(file.type);
  const byExt = /^(mp4|webm|mov)$/.test(getFileExtension(file.name));
  return byMime || byExt;
}

export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}
