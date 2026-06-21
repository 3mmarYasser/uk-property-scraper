/**
 * Portal identifiers. Values intentionally match the Prisma `Portal` enum
 * (string-for-string) so a `Portal` from core is assignable where the DB expects
 * one — without core having to depend on the generated Prisma client.
 */
export const Portal = {
  ONTHEMARKET: 'ONTHEMARKET',
  RIGHTMOVE: 'RIGHTMOVE',
  ZOOPLA: 'ZOOPLA',
} as const;
export type Portal = (typeof Portal)[keyof typeof Portal];

/**
 * The shape an adapter returns from a listing page. Optional fields are `null`
 * (not `undefined`) when missing so that field-quality metrics can count them.
 */
export interface RawListing {
  portal: Portal;
  portalListingId: string;
  url: string;
  displayAddress: string | null;
  postcode: string | null;
  outcode: string | null;
  latitude: number | null;
  longitude: number | null;
  price: number | null;
  currency: string;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  description: string | null;
  agentName: string | null;
  agentBranch: string | null;
  images: string[];
  /** Which extraction path produced this listing — useful for accuracy monitoring. */
  source: 'structured' | 'fallback';
}

/** Fields we track data-quality (null-rate) for. */
export const TRACKED_FIELDS = [
  'displayAddress',
  'price',
  'propertyType',
  'bedrooms',
  'description',
  'agentName',
  'images',
] as const;
export type TrackedField = (typeof TRACKED_FIELDS)[number];

export interface SearchPageResult {
  listingUrls: string[];
  /** Absolute URL of the next results page, or null if this is the last page. */
  nextPageUrl: string | null;
}

export interface PortalAdapter {
  readonly portal: Portal;
  /** Build the search-results URL for a location and 1-indexed page. */
  buildSearchUrl(location: string, page: number): string;
  /** Extract listing detail URLs (and the next-page link) from a search page. */
  parseSearchPage(html: string): SearchPageResult;
  /** Extract a single listing from its detail page HTML. */
  parseListing(html: string, url: string): RawListing;
}
