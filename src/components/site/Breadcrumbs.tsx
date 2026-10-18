import Link from 'next/link';
import JsonLd from '@/components/site/JsonLd';
import { site } from '@/lib/site';

export type Crumb = { name: string; href: string };

/** Where this page sits, for people and for Google's breadcrumb results. */
export default function Breadcrumbs({ trail, tone = 'light' }: { trail: Crumb[]; tone?: 'light' | 'dark' }) {
  const all = [{ name: 'Home', href: '/' }, ...trail];
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: all.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: `${site.url}${c.href === '/' ? '' : c.href}` })),
        }}
      />
      <nav aria-label="Breadcrumb" className={`text-[15px] ${tone === 'dark' ? 'text-white/75' : 'text-soft'}`}>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {all.map((c, i) => (
            <li key={c.href} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden>/</span>}
              {i === all.length - 1 ? (
                <span aria-current="page" className={tone === 'dark' ? 'text-white' : 'text-navy-deep'}>{c.name}</span>
              ) : (
                <Link href={c.href} className="underline-offset-4 hover:underline">{c.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
