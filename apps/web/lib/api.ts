const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface PropertyImage {
  id: string;
  url: string;
  position: number;
}

export interface PriceHistoryPoint {
  id: string;
  price: number;
  changeType: 'INITIAL' | 'INCREASE' | 'DECREASE';
  recordedAt: string;
}

export interface Property {
  id: string;
  portal: string;
  portalListingId: string;
  url: string;
  displayAddress: string;
  outcode: string | null;
  price: number | null;
  currency: string;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  description: string | null;
  agentName: string | null;
  agentBranch: string | null;
  status: string;
  firstSeenAt?: string;
  lastScrapedAt: string;
  images: PropertyImage[];
  priceHistory?: PriceHistoryPoint[];
}

export interface MarketChange {
  id: string;
  price: number;
  changeType: 'DECREASE' | 'INCREASE';
  recordedAt: string;
  property: { id: string; outcode: string | null; displayAddress: string };
}

export interface MarketPulse {
  totalActive: number;
  priceDrops: number;
  lastSync: string | null;
  changes: MarketChange[];
}

export interface ListingsPage {
  total: number;
  page: number;
  pageSize: number;
  items: Property[];
}

export interface FieldQuality {
  field: string;
  totalCount: number;
  nullCount: number;
  nullRate: number;
}

export interface ScrapeRun {
  id: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  trigger: string;
  location: string | null;
  startedAt: string;
  finishedAt: string | null;
  pagesCrawled: number;
  listingsFound: number;
  listingsNew: number;
  listingsUpdated: number;
  priceChanges: number;
  errorCount: number;
  fieldQuality: FieldQuality[];
}

export interface PipelineHealth {
  healthy: boolean;
  maxAgeMinutes: number;
  lastSuccessAt: string | null;
  lastSuccessAgeMinutes: number | null;
  lastRunStatus: string | null;
  lastRunListingsFound: number | null;
  lastRunPriceChanges: number | null;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API ${path} returned ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  listings: (query = '') => get<ListingsPage>(`/listings${query}`),
  listing: (id: string) => get<Property>(`/listings/${id}`),
  marketPulse: () => get<MarketPulse>(`/listings/market/pulse`),
  runs: () => get<ScrapeRun[]>(`/runs`),
  pipelineHealth: () => get<PipelineHealth>(`/health/pipeline`),
};

/** Compact price for dense contexts: £550k, £1.2m. */
export function formatPriceShort(price: number | null): string {
  if (price == null) return 'POA';
  if (price >= 1_000_000) return `£${(price / 1_000_000).toFixed(price % 1_000_000 === 0 ? 0 : 1)}m`;
  if (price >= 1_000) return `£${Math.round(price / 1_000)}k`;
  return `£${price}`;
}

export function formatPrice(price: number | null, currency = 'GBP'): string {
  if (price == null) return 'POA';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

/** "4m ago", "3h ago", "2d ago" — compact relative time for operational views. */
export function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export interface PriceChange {
  direction: 'down' | 'up' | 'flat';
  delta: number;
  pct: number;
}

/** Net change from the first recorded price to the current one. */
export function priceChange(history: PriceHistoryPoint[] | undefined, current: number | null): PriceChange | null {
  if (!history || history.length < 2 || current == null) return null;
  const first = history[0].price;
  const delta = current - first;
  if (delta === 0) return { direction: 'flat', delta: 0, pct: 0 };
  return {
    direction: delta < 0 ? 'down' : 'up',
    delta: Math.abs(delta),
    pct: Math.abs((delta / first) * 100),
  };
}
