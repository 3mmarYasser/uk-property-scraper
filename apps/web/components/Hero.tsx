import { MarketPulse } from './MarketPulse';
import { MarketPulse as MarketPulseData, formatRelative } from '../lib/api';

export function Hero({ pulse }: { pulse: MarketPulseData | null }) {
  return (
    <section className="hero">
      <div className="hero-grid" aria-hidden />
      <div className="hero-inner">
        <div className="eyebrow">UK Property Intelligence</div>
        <h1 className="hero-title">
          Know the market <span>before it moves.</span>
        </h1>
        <p className="hero-sub">
          Keystone indexes live UK listings from OnTheMarket, captures every price change, and surfaces
          market movement the moment it happens.
        </p>

        {pulse && (
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="n num">{pulse.totalActive.toLocaleString('en-GB')}</span>
              <span className="l">listings tracked</span>
            </div>
            <span className="hero-div" />
            <div className="hero-stat">
              <span className="n num" style={{ color: 'var(--down)' }}>
                {pulse.priceDrops.toLocaleString('en-GB')}
              </span>
              <span className="l">price drops logged</span>
            </div>
            <span className="hero-div" />
            <div className="hero-stat">
              <span className="n num">{formatRelative(pulse.lastSync)}</span>
              <span className="l">last synced</span>
            </div>
          </div>
        )}
      </div>

      {pulse && pulse.changes.length > 0 && <MarketPulse changes={pulse.changes} />}
    </section>
  );
}
