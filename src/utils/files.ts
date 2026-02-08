export function fileToDataUrl(file: File): Promise<string> {
  console.log('[Canvasly] fileToDataUrl called', { name: file.name, type: file.type, size: file.size });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      console.log('[Canvasly] fileToDataUrl resolved', { name: file.name, dataUrlLength: result.length });
      resolve(result);
    };
    reader.onerror = (err) => {
      console.error('[Canvasly] fileToDataUrl FAILED', { name: file.name, error: err });
      reject(err);
    };
    reader.readAsDataURL(file);
  });
}

export function isImageFile(file: File): boolean {
  const byMime = /^image\/(png|jpe?g|webp|svg\+xml|gif)$/.test(file.type);
  const byExt = /^(png|jpe?g|webp|svg|gif)$/.test(getFileExtension(file.name));
  const result = byMime || byExt;
  console.log('[Canvasly] isImageFile', { name: file.name, type: file.type, result });
  return result;
}

export function isGifFile(file: File): boolean {
  const result = file.type === 'image/gif' || getFileExtension(file.name) === 'gif';
  console.log('[Canvasly] isGifFile', { name: file.name, type: file.type, result });
  return result;
}

export function isVideoFile(file: File): boolean {
  const byMime = /^video\/(mp4|webm|quicktime)$/.test(file.type);
  const byExt = /^(mp4|webm|mov)$/.test(getFileExtension(file.name));
  const result = byMime || byExt;
  console.log('[Canvasly] isVideoFile', { name: file.name, type: file.type, result });
  return result;
}

export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}
