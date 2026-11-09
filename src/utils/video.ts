export interface ParsedVideo {
  platform: 'youtube' | 'vimeo' | 'other';
  embedUrl: string;
  thumbnailUrl?: string;
  id?: string;
}

export function parseVideoUrl(url: string): ParsedVideo | null {
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );

  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return {
      platform: 'youtube',
      id: videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    return {
      platform: 'vimeo',
      id: videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1`,
    };
  }

  return null;
}

export function isVideoUrl(url: string): boolean {
  return parseVideoUrl(url) !== null;
}

/** Title and thumbnail from the public oEmbed endpoints. Fails quietly when offline. */
export async function fetchVideoMetadata(
  url: string,
  platform: 'youtube' | 'vimeo'
): Promise<{ title?: string; thumbnailUrl?: string }> {
  const endpoint =
    platform === 'youtube'
      ? `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`
      : `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
  try {
    const response = await fetch(endpoint);
    if (!response.ok) return {};
    const json = (await response.json()) as { title?: unknown; thumbnail_url?: unknown };
    return {
      title: typeof json.title === 'string' ? json.title : undefined,
      thumbnailUrl: typeof json.thumbnail_url === 'string' ? json.thumbnail_url : undefined,
    };
  } catch {
    return {};
  }
}

/** Extract duration (seconds) from a video file via an offscreen element. */
export function getVideoDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    let settled = false;
    const finish = (value: number | undefined) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
      resolve(value);
    };
    const timer = setTimeout(() => finish(undefined), 4000);
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      finish(Number.isFinite(video.duration) ? video.duration : undefined);
    };
    video.onerror = () => finish(undefined);
    video.src = url;
  });
}
