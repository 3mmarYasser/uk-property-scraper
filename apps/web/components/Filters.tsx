'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Search } from './icons';

const BEDS = ['1', '2', '3', '4', '5'];

export function Filters() {
  const router = useRouter();
  const params = useSearchParams();

  const [form, setForm] = useState({
    q: params.get('q') ?? '',
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    bedrooms: params.get('bedrooms') ?? '',
    propertyType: params.get('propertyType') ?? '',
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const push = (next: typeof form) => {
    const qs = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => {
      if (v) qs.set(k, v);
    });
    router.push(qs.toString() ? `/?${qs.toString()}` : '/');
  };

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    push(form);
  };

  const toggleBeds = (n: string) => {
    const next = { ...form, bedrooms: form.bedrooms === n ? '' : n };
    setForm(next);
    push(next);
  };

  const reset = () => {
    const cleared = { q: '', minPrice: '', maxPrice: '', bedrooms: '', propertyType: '' };
    setForm(cleared);
    router.push('/');
  };

  const hasFilters = Object.values(form).some(Boolean);

  return (
    <form className="toolbar" onSubmit={apply} role="search">
      <div className="search">
        <Search width={16} height={16} />
        <input
          className="input"
          placeholder="Search by address or estate agent…"
          aria-label="Search listings"
          value={form.q}
          onChange={(e) => set('q', e.target.value)}
        />
      </div>

      <div className="seg" role="group" aria-label="Minimum bedrooms">
        {BEDS.map((n) => (
          <button key={n} type="button" className={form.bedrooms === n ? 'on' : ''} onClick={() => toggleBeds(n)}>
            {n}+
          </button>
        ))}
      </div>

      <div className="price-range">
        <input
          className="input"
          placeholder="Min £"
          inputMode="numeric"
          aria-label="Minimum price"
          value={form.minPrice}
          onChange={(e) => set('minPrice', e.target.value)}
        />
        <input
          className="input"
          placeholder="Max £"
          inputMode="numeric"
          aria-label="Maximum price"
          value={form.maxPrice}
          onChange={(e) => set('maxPrice', e.target.value)}
        />
      </div>
      <input
        className="input"
        placeholder="Type (e.g. Flat)"
        aria-label="Property type"
        style={{ width: 140 }}
        value={form.propertyType}
        onChange={(e) => set('propertyType', e.target.value)}
      />

      <button className="btn btn-primary sm" type="submit">
        Apply
      </button>
      {hasFilters && (
        <button className="btn btn-ghost sm" type="button" onClick={reset}>
          Clear
        </button>
      )}
    </form>
  );
}
