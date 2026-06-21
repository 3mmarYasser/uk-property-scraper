import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Gallery } from '../../../components/Gallery';
import { PriceChart } from '../../../components/PriceChart';
import { ArrowDownRight, ArrowUpRight, Bath, Bed, ChevronLeft, External, Home, Pin } from '../../../components/icons';
import { api, formatPrice, formatRelative, priceChange, Property } from '../../../lib/api';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const l = await api.listing(params.id);
    const beds = l.bedrooms != null ? `${l.bedrooms} bed ` : '';
    return {
      title: `${formatPrice(l.price)} — ${l.displayAddress}`,
      description: `${beds}${l.propertyType ?? 'property'} in ${l.displayAddress}, marketed by ${l.agentName ?? 'an agent'} on Keystone.`,
    };
  } catch {
    return { title: 'Listing' };
  }
}

function ChangePill({ listing }: { listing: Property }) {
  const change = priceChange(listing.priceHistory, listing.price);
  if (!change) return null;
  if (change.direction === 'flat') {
    return <span className="change-pill flat">No change since listed</span>;
  }
  const Icon = change.direction === 'down' ? ArrowDownRight : ArrowUpRight;
  const verb = change.direction === 'down' ? 'reduced' : 'increased';
  return (
    <span className={`change-pill ${change.direction}`}>
      <Icon width={13} height={13} />
      {verb} £{change.delta.toLocaleString('en-GB')} ({change.pct.toFixed(1)}%)
    </span>
  );
}

export default async function ListingPage({ params }: { params: { id: string } }) {
  let listing: Property;
  try {
    listing = await api.listing(params.id);
  } catch {
    notFound();
  }

  const l = listing!;
  const images = l.images.map((img) => img.url);
  const history = l.priceHistory ?? [];

  const subtitle = [
    l.bedrooms != null ? `${l.bedrooms} bed` : null,
    l.bathrooms != null ? `${l.bathrooms} bath` : null,
    l.propertyType,
  ]
    .filter(Boolean)
    .join(' · ');

  const firstListed = history[0]?.recordedAt;
  const daysTracked = l.firstSeenAt
    ? Math.max(0, Math.floor((Date.now() - new Date(l.firstSeenAt).getTime()) / 86_400_000))
    : null;

  return (
    <div className="rise-1">
      <Link href="/" className="backlink">
        <ChevronLeft width={15} height={15} /> All listings
      </Link>

      <div className="detail-header">
        <h1 className="detail-title">{l.displayAddress}</h1>
        <div className="detail-subtitle">
          {subtitle && <span>{subtitle}</span>}
          {l.outcode && <span className="outcode">{l.outcode}</span>}
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <Gallery images={images} alt={l.displayAddress} />

          <div className="facts-strip" style={{ marginTop: 20 }}>
            <div className="fact-tile">
              <div className="k">
                <Bed width={14} height={14} /> Bedrooms
              </div>
              <div className="v num">{l.bedrooms ?? '—'}</div>
            </div>
            <div className="fact-tile">
              <div className="k">
                <Bath width={14} height={14} /> Bathrooms
              </div>
              <div className="v num">{l.bathrooms ?? '—'}</div>
            </div>
            <div className="fact-tile">
              <div className="k">
                <Home width={14} height={14} /> Type
              </div>
              <div className="v" style={{ fontSize: 14 }}>
                {l.propertyType ?? '—'}
              </div>
            </div>
            <div className="fact-tile">
              <div className="k">
                <Pin width={14} height={14} /> Area
              </div>
              <div className="v num">{l.outcode ?? '—'}</div>
            </div>
          </div>

          <div className="section-card">
            <div className="section-head">
              <div className="eyebrow">Price history</div>
            </div>
            <PriceChart history={history} />
          </div>

          <div className="section-card">
            <div className="eyebrow" style={{ marginBottom: 12 }}>
              Description
            </div>
            <p className="desc">{l.description || 'No description provided for this listing.'}</p>
          </div>
        </div>

        <aside>
          <div className="summary">
            <div className="summary-price num">{formatPrice(l.price, l.currency)}</div>
            <div>
              <ChangePill listing={l} />
            </div>
            <div className="summary-addr">{l.displayAddress}</div>

            <a className="btn btn-primary" href={l.url} target="_blank" rel="noreferrer">
              View on OnTheMarket <External width={15} height={15} />
            </a>

            <div className="summary-meta">
              <div className="row">
                <span>Status</span>
                <span>{l.status.replace('_', ' ')}</span>
              </div>
              <div className="row">
                <span>Estate agent</span>
                <span style={{ textAlign: 'right' }}>{l.agentName || 'Unknown'}</span>
              </div>
              {firstListed && (
                <div className="row">
                  <span>First listed</span>
                  <span className="num">
                    {new Date(firstListed).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </span>
                </div>
              )}
              {daysTracked != null && (
                <div className="row">
                  <span>Tracked for</span>
                  <span className="num">{daysTracked === 0 ? 'today' : `${daysTracked}d`}</span>
                </div>
              )}
              <div className="row">
                <span>Last checked</span>
                <span className="num">{formatRelative(l.lastScrapedAt)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Sticky quick-action bar — mobile only, so price + CTA are always reachable. */}
      <div className="mobile-cta">
        <span className="p num">{formatPrice(l.price, l.currency)}</span>
        <a className="btn btn-primary" href={l.url} target="_blank" rel="noreferrer">
          View on OnTheMarket <External width={15} height={15} />
        </a>
      </div>
    </div>
  );
}
