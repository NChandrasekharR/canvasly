export interface VideoEmbedData {
  url: string;
  embedUrl: string;
  platform: 'youtube' | 'vimeo' | 'other';
  title?: string;
  thumbnailUrl?: string;
  duration?: number;
}

export interface VideoUploadData {
  blobId: string;
  fileName: string;
  mimeType: string;
  duration?: number;
  fileSize: number;
}

export interface ImageItemData {
  blobId?: string;
  url?: string;
  fileName?: string;
  caption?: string;
}

export interface LottieData {
  blobId?: string;
  url?: string;
  animationData?: object;
  speed: number;
  fileName?: string;
}

export interface RiveData {
  blobId: string;
  fileName: string;
  fileSize: number;
  stateMachineNames?: string[];
  activeStateMachine?: string;
  speed: number;
}

export interface CodeData {
  language: 'html' | 'css' | 'javascript' | 'p5js';
  code: string;
  showPreview: boolean;
}

export interface TextData {
  content: string;
}

export interface ColorData {
  hex: string;
  label?: string;
}

export type BoardItemType =
  | 'video-embed'
  | 'video-upload'
  | 'image'
  | 'lottie'
  | 'rive'
  | 'code'
  | 'text'
  | 'color';

export type BoardItemData =
  | VideoEmbedData
  | VideoUploadData
  | ImageItemData
  | LottieData
  | RiveData
  | CodeData
  | TextData
  | ColorData;

export interface BoardItem {
  id: string;
  type: BoardItemType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  tags: string[];
  groupId?: string;
  createdAt: Date;
  data: BoardItemData;
}

export interface Group {
  id: string;
  label?: string;
  itemIds: string[];
  collapsed: boolean;
}

export interface Board {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  items: BoardItem[];
  groups: Group[];
  thumbnail?: Blob;
  storageSize?: number;
}
