export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function isImageFile(file: File): boolean {
  return /^image\/(png|jpe?g|webp|svg\+xml|gif)$/.test(file.type);
}

export function isGifFile(file: File): boolean {
  return file.type === 'image/gif';
}

export function isVideoFile(file: File): boolean {
  return /^video\/(mp4|webm|quicktime)$/.test(file.type);
}

export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}
