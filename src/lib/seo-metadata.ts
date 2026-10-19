import type { Metadata } from 'next';
import { site } from '@/lib/site';

export const socialImage = {
  url: new URL('/brand/social-preview-home-care.png', site.url).href,
  width: 1731,
  height: 909,
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
