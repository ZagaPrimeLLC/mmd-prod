'use client';

import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { track } from '@vercel/analytics';
import { captureFirstTouch } from '@/lib/attribution';

/**
 * Public site only (never the CRM): records where the visitor came from, counts
 * page views with Vercel Analytics (cookieless), and counts taps on the phone,
 * email and WhatsApp links, which outnumber form fills for a service business.
 */
export default function SiteTracking() {
  useEffect(() => {
    captureFirstTouch();

    function onClick(e: MouseEvent) {
      const a = (e.target as HTMLElement | null)?.closest('a');
      const href = a?.getAttribute('href') ?? '';
      const where = window.location.pathname;
      if (href.startsWith('tel:')) track('call_click', { where });
      else if (href.startsWith('mailto:')) track('email_click', { where });
      else if (/wa\.me|whatsapp/i.test(href)) track('whatsapp_click', { where });
    }
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return <Analytics />;
}
