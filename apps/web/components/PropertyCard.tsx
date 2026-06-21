import Link from 'next/link';
import { Property, formatPrice } from '../lib/api';
import { ArrowDownRight, ArrowUpRight, Bath, Bed } from './icons';

export function PropertyCard({ p, i }: { p: Property; i: number }) {
  const thumb = p.images[0]?.url;
  const latest = p.priceHistory?.[0];
  const drop = latest?.changeType === 'DECREASE';
  const rise = latest?.changeType === 'INCREASE';

  return (
    <Link href={`/listings/${p.id}`} className="card rise" style={{ '--i': i } as React.CSSProperties}>
      <div className="card-media">
        {thumb ? (
          <img className="card-img" src={thumb} alt={p.displayAddress} loading="lazy" />
        ) : null}
        <div className="card-scrim" />
        {drop && (
          <span className="tag down">
            <ArrowDownRight width={12} height={12} /> Price drop
          </span>
        )}
        {!drop && rise && (
          <span className="tag up">
            <ArrowUpRight width={12} height={12} /> Price rise
          </span>
        )}
        {!drop && !rise && p.status !== 'ACTIVE' && <span className="tag">{p.status.replace('_', ' ')}</span>}
      </div>

      <div className="card-body">
        <div className="card-price">{formatPrice(p.price, p.currency)}</div>
        <div className="card-addr">{p.displayAddress}</div>
        <div className="card-facts">
          {p.bedrooms != null && (
            <span className="fact">
              <Bed width={15} height={15} />
              {p.bedrooms}
            </span>
          )}
          {p.bathrooms != null && (
            <span className="fact">
              <Bath width={15} height={15} />
              {p.bathrooms}
            </span>
          )}
          {p.propertyType && <span className="fact">{p.propertyType}</span>}
          {p.outcode && <span className="outcode">{p.outcode}</span>}
        </div>
      </div>
    </Link>
  );
}
