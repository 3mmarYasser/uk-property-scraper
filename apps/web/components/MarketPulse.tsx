import Link from 'next/link';
import { MarketChange, formatPriceShort } from '../lib/api';

/**
 * A live price-movement ticker — the platform's signature "we're watching the
 * market right now" element. Pure-CSS marquee; pauses on hover; respects
 * reduced motion. Items duplicated once so the loop is seamless.
 */
export function MarketPulse({ changes }: { changes: MarketChange[] }) {
  if (!changes || changes.length === 0) return null;

  const items = [...changes, ...changes];

  return (
    <div className="ticker" aria-label="Recent price movements">
      <div className="ticker-track">
        {items.map((c, i) => {
          const down = c.changeType === 'DECREASE';
          return (
            <Link key={`${c.id}-${i}`} href={`/listings/${c.property.id}`} className="tick" aria-hidden={i >= changes.length}>
              <span className="tick-oc">{c.property.outcode ?? 'UK'}</span>
              <span className={`tick-dir ${down ? 'down' : 'up'}`}>{down ? '▼' : '▲'}</span>
              <span className="tick-price num">{formatPriceShort(c.price)}</span>
              <span className="tick-addr">{c.property.displayAddress}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
