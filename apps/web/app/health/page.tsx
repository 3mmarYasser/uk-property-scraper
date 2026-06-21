import { Warn } from '../../components/icons';
import { api, FieldQuality, formatRelative, PipelineHealth, ScrapeRun } from '../../lib/api';

export const dynamic = 'force-dynamic';

const STATUS_CLASS: Record<string, string> = { SUCCESS: 's', FAILED: 'f', RUNNING: 'r' };

function Meter({ fq }: { fq: FieldQuality }) {
  const present = Math.round((1 - fq.nullRate) * 100);
  const cls = present >= 85 ? 'ok' : present >= 60 ? 'warn' : 'bad';
  return (
    <div className="meter-row">
      <span className="meter-name">{fq.field}</span>
      <div className="meter-track">
        <div className={`meter-fill ${cls}`} style={{ width: `${present}%` }} />
      </div>
      <span className="meter-val">
        {present}% · {fq.totalCount - fq.nullCount}/{fq.totalCount}
      </span>
    </div>
  );
}

export default async function HealthPage() {
  let health: PipelineHealth | null = null;
  let runs: ScrapeRun[] = [];
  let error: string | null = null;

  try {
    [health, runs] = await Promise.all([api.pipelineHealth(), api.runs()]);
  } catch (e) {
    error = (e as Error).message;
  }

  const latestWithQuality = runs.find((r) => r.fieldQuality.length > 0);
  const spark = [...runs].slice(0, 14).reverse();
  const maxFound = Math.max(1, ...spark.map((r) => r.listingsFound));

  return (
    <div className="rise-1">
      <div className="page-head">
        <div className="eyebrow">Pipeline · Observability</div>
        <h1>Pipeline health</h1>
        <p className="lead">Is the scraper alive, and is the data it produces trustworthy?</p>
      </div>

      {error && (
        <div className="panel">
          <div className="panel-icon">
            <Warn width={22} height={22} />
          </div>
          <h3>Can&apos;t reach the API</h3>
          <p className="muted">{error}</p>
        </div>
      )}

      {health && (
        <div className={`status-hero ${health.healthy ? 'ok' : 'bad'}`}>
          <span className="status-orb" aria-hidden />
          <div>
            <div className="status-title">{health.healthy ? 'All systems operational' : 'Scraper stale — needs attention'}</div>
            <div className="status-sub">
              {health.lastSuccessAt
                ? `Last successful run ${formatRelative(health.lastSuccessAt)} · ${health.lastRunListingsFound ?? 0} listings · threshold ${health.maxAgeMinutes}m`
                : 'No successful run recorded yet.'}
            </div>
          </div>
          {spark.length > 0 && (
            <div className="status-spark" title="Recent run volume & status">
              {spark.map((r) => (
                <span
                  key={r.id}
                  className={`spark-tick ${STATUS_CLASS[r.status] ?? ''}`}
                  style={{ height: `${12 + (r.listingsFound / maxFound) * 28}px` }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {health && (
        <div className="stats">
          <div className="stat">
            <div className="stat-num">{health.lastSuccessAgeMinutes != null ? `${health.lastSuccessAgeMinutes}m` : '—'}</div>
            <div className="stat-label">Since last success</div>
          </div>
          <div className="stat">
            <div className="stat-num">{health.lastRunListingsFound ?? '—'}</div>
            <div className="stat-label">Listings · last run</div>
          </div>
          <div className="stat">
            <div className="stat-num">{health.lastRunPriceChanges ?? '—'}</div>
            <div className="stat-label">Price changes detected</div>
          </div>
          <div className="stat">
            <div className="stat-num" style={{ color: health.lastRunStatus === 'FAILED' ? 'var(--bad)' : undefined }}>
              {health.lastRunStatus ?? '—'}
            </div>
            <div className="stat-label">Last run status</div>
          </div>
        </div>
      )}

      {latestWithQuality && (
        <div className="section-card" style={{ marginTop: 18 }}>
          <div className="section-head">
            <div className="eyebrow">Field completeness · last run</div>
            <span className="muted-2" style={{ fontSize: 12.5 }}>
              a sudden drop = a broken selector
            </span>
          </div>
          {latestWithQuality.fieldQuality.map((fq) => (
            <Meter key={fq.field} fq={fq} />
          ))}
        </div>
      )}

      <div className="section-card">
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          Recent runs
        </div>
        <div className="runs">
          {runs.map((r) => (
            <div className="run-row" key={r.id}>
              <div className="run-when">
                {new Date(r.startedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                <small>
                  {formatRelative(r.startedAt)} · {r.trigger.toLowerCase()}
                </small>
              </div>
              <span className="run-status">
                <span className={`status-dot ${STATUS_CLASS[r.status] ?? ''}`} />
                {r.status}
              </span>
              <div className="run-metrics">
                <span>
                  found <b>{r.listingsFound}</b>
                </span>
                <span>
                  new <b>{r.listingsNew}</b>
                </span>
                <span>
                  Δ <b>{r.priceChanges}</b>
                </span>
                {r.errorCount > 0 ? (
                  <span className="err">
                    err <b>{r.errorCount}</b>
                  </span>
                ) : (
                  <span>
                    err <b>0</b>
                  </span>
                )}
              </div>
            </div>
          ))}
          {runs.length === 0 && <div className="muted-2" style={{ padding: 14 }}>No runs yet.</div>}
        </div>
      </div>
    </div>
  );
}
