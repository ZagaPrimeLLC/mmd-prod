import type { Metadata } from 'next';
import { site } from '@/lib/site';

export const socialImage = {
  url: new URL('/brand/social-preview.png', site.url).href,
  width: 1200,
  height: 630,
  alt: 'MMD Community Care — support for adults with developmental disabilities in New Jersey',
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
