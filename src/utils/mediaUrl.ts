export type DishMediaType = 'image' | 'video';

export function isVideoMedia(
  mediaType?: string | null,
  videoUrl?: string | null,
): boolean {
  if (mediaType === 'video' && videoUrl) return true;
  return false;
}

export function getDishVideoUrl(videoUrl?: string | null): string {
  if (!videoUrl) return '';
  return videoUrl;
}
