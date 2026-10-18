import { getImageProps } from 'next/image';
import type { Photo } from '@/lib/photos';

/**
 * One photograph in the shape that fits the screen: the portrait original on
 * phones, the 16:9 version from tablets up, the 21:9 version on wide screens.
 * The browser downloads only the one it shows, so a wide slot never has to
 * crop a portrait picture. Fills its (positioned) parent.
 */
export default function ArtImage({
  photo, className = '', priority = false, sizes = '100vw', position, noUltra = false,
}: {
  photo: Photo;
  className?: string;
  priority?: boolean;
  sizes?: string;
  /** CSS object-position, e.g. "center 15%" to protect heads near the top. */
  position?: string;
  /** Stop at 16:9 (for slots that are never wider than that). */
  noUltra?: boolean;
}) {
  const common = { alt: photo.alt, fill: true as const, sizes, priority, quality: 82 };
  const { props: base } = getImageProps({ ...common, src: photo.src });
  const wide = photo.wide ? getImageProps({ ...common, src: photo.wide }).props : null;
  const ultra = photo.ultra && !noUltra ? getImageProps({ ...common, src: photo.ultra }).props : null;
  return (
    <picture>
      {ultra && <source media="(min-width: 1280px)" srcSet={ultra.srcSet} sizes={ultra.sizes} />}
      {wide && <source media="(min-width: 640px)" srcSet={wide.srcSet} sizes={wide.sizes} />}
      <img {...base} alt={photo.alt} className={className} style={{ ...base.style, objectFit: 'cover', objectPosition: position }} />
    </picture>
  );
}
