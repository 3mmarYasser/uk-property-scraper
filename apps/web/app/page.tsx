import { Filters } from '../components/Filters';
import { Hero } from '../components/Hero';
import { PropertyCard } from '../components/PropertyCard';
import { Inbox, Plug } from '../components/icons';
import { api, MarketPulse } from '../lib/api';

export const dynamic = 'force-dynamic';

function buildQuery(searchParams: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const key of ['q', 'minPrice', 'maxPrice', 'bedrooms', 'propertyType', 'page']) {
    const value = searchParams[key];
    if (value) qs.set(key, value);
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

function pageHref(searchParams: Record<string, string | undefined>, page: number): string {
  const qs = new URLSearchParams();
  for (const key of ['q', 'minPrice', 'maxPrice', 'bedrooms', 'propertyType']) {
    const value = searchParams[key];
    if (value) qs.set(key, value);
  }
  if (page > 1) qs.set('page', String(page));
  const s = qs.toString();
  return s ? `/?${s}` : '/';
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  let data;
  let pulse: MarketPulse | null = null;
  let error: string | null = null;

  const [listingsResult, pulseResult] = await Promise.allSettled([
    api.listings(buildQuery(searchParams)),
    api.marketPulse(),
  ]);
  if (listingsResult.status === 'fulfilled') data = listingsResult.value;
  else error = (listingsResult.reason as Error).message;
  if (pulseResult.status === 'fulfilled') pulse = pulseResult.value;

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <Hero pulse={pulse} />

      <div className="section-title-row" id="listings">
        <div>
          <div className="eyebrow">Browse</div>
          <h2 className="section-title">All listings</h2>
        </div>
        {data && (
          <span className="count">
            <b className="num">{data.total}</b> {data.total === 1 ? 'property' : 'properties'}
            {totalPages > 1 && <span className="muted-2"> · page {data.page}/{totalPages}</span>}
          </span>
        )}
      </div>

      <Filters />

      {error && (
        <div className="panel rise-1" style={{ marginTop: 22 }}>
          <div className="panel-icon">
            <Plug width={22} height={22} />
          </div>
          <h3>Can&apos;t reach the API</h3>
          <p>
            The dashboard couldn&apos;t load listings from{' '}
            <code>{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}</code>. Start the API and refresh.
          </p>
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="panel rise-1" style={{ marginTop: 22 }}>
          <div className="panel-icon">
            <Inbox width={22} height={22} />
          </div>
          <h3>No listings match</h3>
          <p>
            Clear your filters, or run a scrape to populate the database:{' '}
            <code>curl -X POST localhost:3001/scrape</code>
          </p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="cards" style={{ marginTop: 18 }}>
            {data.items.map((p, i) => (
              <PropertyCard key={p.id} p={p} i={i} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="pager" aria-label="Pagination">
              <a
                className={`btn btn-ghost sm ${data.page <= 1 ? 'disabled' : ''}`}
                href={pageHref(searchParams, data.page - 1)}
                aria-disabled={data.page <= 1}
              >
                ← Prev
              </a>
              <span className="num">
                {data.page} / {totalPages}
              </span>
              <a
                className={`btn btn-ghost sm ${data.page >= totalPages ? 'disabled' : ''}`}
                href={pageHref(searchParams, data.page + 1)}
                aria-disabled={data.page >= totalPages}
              >
                Next →
              </a>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
