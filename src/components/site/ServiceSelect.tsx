'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SERVICE_CATALOG, serviceFromSearch } from '@/lib/services';

const field = 'mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-navy-deep focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy';

function Options({ id, initial = '' }: { id: string; initial?: string }) {
  return <select key={initial} id={id} name="service" defaultValue={initial} className={field}>
    <option value="">Not sure yet</option>
    <optgroup label="Home Care Services">
      {SERVICE_CATALOG.filter(s => s.program === 'home-care').map(s => <option key={s.slug} value={s.inquiryValue}>{s.name}</option>)}
    </optgroup>
    <optgroup label="Developmental Disability Services (DDD)">
      {SERVICE_CATALOG.filter(s => s.program === 'ddd').map(s => <option key={s.slug} value={s.inquiryValue}>{s.name}</option>)}
    </optgroup>
    <option value="other">Something else</option>
  </select>;
}

function SelectedOptions({ id }: { id: string }) {
  const search = useSearchParams();
  return <Options id={id} initial={serviceFromSearch(search?.toString() ?? '')?.inquiryValue} />;
}

export default function ServiceSelect({ id }: { id: string }) {
  return <div>
    <label htmlFor={id} className="block text-sm font-semibold text-gray-800">What are you looking for?</label>
    <Suspense fallback={<Options id={id} />}><SelectedOptions id={id} /></Suspense>
  </div>;
}
