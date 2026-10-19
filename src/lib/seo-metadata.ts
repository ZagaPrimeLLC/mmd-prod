import type { Metadata } from 'next';
import { site } from '@/lib/site';

const socialImageUrl = new URL('/brand/social-preview-ddd-home-care-v3.jpg', site.url).href;

// A compact, fixed-size JPEG keeps link-preview downloads small. Version the
// filename when replacing it so crawlers do not reuse an earlier image result.
export const socialImage = {
  url: socialImageUrl,
  secureUrl: socialImageUrl,
  type: 'image/jpeg',
  width: 1200,
  height: 630,
  alt: `${site.name} — ${site.tagline}`,
};

/** Page-level Open Graph objects replace inherited values, so keep them complete. */
export function pageMetadata({ title, description, path }: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const socialTitle = `${title} | ${site.name}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: socialTitle,
      description,
      url: new URL(path, site.url).href,
      siteName: site.name,
      type: 'website',
      locale: 'en_US',
      images: [socialImage],
    },
    twitter: { card: 'summary_large_image', title: socialTitle, description, images: [socialImage] },
  };
}
