import type { TFile } from 'obsidian';

export interface LocalImage {
  name: string;
  path: string;
  size: number;
  mtime: Date;
  file: TFile;
}

export { ImageSearch, type ReferenceMatch, type ReplaceResult } from './ImageSearch';
export { LocalImagesView, LOCAL_IMAGES_VIEW_TYPE } from './LocalImagesView';
export { LocalImageDetailModal } from './LocalImageDetailModal';
