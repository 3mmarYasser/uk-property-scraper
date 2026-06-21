import * as cheerio from 'cheerio';
import { Portal, PortalAdapter, RawListing, SearchPageResult } from '../types';
import {
  deriveOutcode,
  extractNextData,
  parsePrice,
  stripHtml,
} from '../utils/html';

const BASE = 'https://www.onthemarket.com';

/**
 * OnTheMarket adapter.
 *
 * Extraction is layered for resilience:
 *   1. STRUCTURED — read the hydrated Redux state embedded in `__NEXT_DATA__`
 *      (`props.initialReduxState.property`). This is the richest, most reliable
 *      source and yields every required field.
 *   2. FALLBACK — if that blob is missing or shaped differently (a site change),
 *      reconstruct a degraded listing from OpenGraph meta tags, which are far
 *      more stable. The `source` flag records which path ran so extraction
 *      accuracy can be monitored (a spike in `fallback` = the structured path
 *      drifted and needs attention).
 */
export class OnTheMarketAdapter implements PortalAdapter {
  readonly portal: Portal = Portal.ONTHEMARKET;

  buildSearchUrl(location: string, page: number): string {
    const path = `/for-sale/property/${encodeURIComponent(location)}/`;
    return page > 1 ? `${BASE}${path}?page=${page}` : `${BASE}${path}`;
  }

  parseSearchPage(html: string): SearchPageResult {
    const $ = cheerio.load(html);

    const ids = new Set<string>();
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const m = href.match(/\/details\/(\d+)/);
      if (m) ids.add(m[1]);
    });
    // Regex sweep as a backstop in case anchors are rendered differently.
    for (const m of html.matchAll(/\/details\/(\d+)/g)) ids.add(m[1]);

    const listingUrls = [...ids].map((id) => `${BASE}/details/${id}/`);

    const nextHref = $('link[rel="next"]').attr('href');
    const nextPageUrl = nextHref
      ? nextHref.startsWith('http')
        ? nextHref
        : `${BASE}${nextHref}`
      : null;

    return { listingUrls, nextPageUrl };
  }

  parseListing(html: string, url: string): RawListing {
    const structured = this.parseStructured(html, url);
    if (structured) return structured;
    return this.parseFallback(html, url);
  }

  // --- structured path -----------------------------------------------------

  private parseStructured(html: string, url: string): RawListing | null {
    const data = extractNextData(html);
    const property = data?.props?.initialReduxState?.property;
    if (!property || (!property.id && property.id !== 0)) return null;

    const dataLayer = data?.props?.initialReduxState?.metadata?.dataLayer ?? {};
    const geo =
      data?.props?.initialReduxState?.maps?.geoLocation?.result ??
      data?.props?.initialReduxState?.maps?.geoLocation ??
      {};

    const postcode: string | null = dataLayer.postcode ?? property.postcode ?? null;

    const images: string[] = Array.isArray(property.images)
      ? Array.from(
          new Set(
            property.images
              .map((img: any) => img?.largeUrl ?? img?.url ?? null)
              .filter((u: unknown): u is string => typeof u === 'string'),
          ),
        )
      : [];

    const price =
      typeof property.priceRaw === 'number'
        ? property.priceRaw
        : parsePrice(property.priceRaw ?? dataLayer.price);

    const agent = property.agent ?? {};

    return {
      portal: this.portal,
      portalListingId: String(property.id),
      url: property.canonicalUrl ?? url,
      displayAddress: property.displayAddress ?? null,
      postcode,
      outcode: deriveOutcode(postcode),
      latitude: typeof geo.lat === 'number' ? geo.lat : null,
      longitude: typeof geo.lng === 'number' ? geo.lng : null,
      price: price ?? null,
      currency: 'GBP',
      propertyType: property.humanisedPropertyType ?? null,
      bedrooms: typeof property.bedrooms === 'number' ? property.bedrooms : null,
      bathrooms: typeof property.bathrooms === 'number' ? property.bathrooms : null,
      description: stripHtml(property.description ?? property.summary ?? null),
      agentName: agent.name ?? null,
      agentBranch: agent.groupName ?? agent.companyName ?? null,
      images,
      source: 'structured',
    };
  }

  // --- fallback path -------------------------------------------------------

  private parseFallback(html: string, url: string): RawListing {
    const $ = cheerio.load(html);
    const og = (prop: string): string | null =>
      $(`meta[property="og:${prop}"]`).attr('content')?.trim() ?? null;

    const title = og('title') ?? '';
    const description = og('description');
    const image = og('image');
    const canonical = og('url') ?? url;

    const idMatch = canonical.match(/\/details\/(\d+)/);
    const portalListingId = idMatch ? idMatch[1] : canonical;

    // "Riverside Quarter, Wandsworth, SW18 2 bed flat for sale - £550,000"
    const price = parsePrice(title.split('-').pop() ?? null);
    const bedMatch = title.match(/(\d+)\s*bed/i);
    const typeMatch = title.match(/bed\s+([a-z ]+?)\s+(?:for sale|to rent)/i);
    // address = the part before the "<n> bed" segment
    const address = bedMatch ? title.slice(0, title.indexOf(bedMatch[0])).trim() : null;
    // og:description often starts with "<Agent> present this ..."
    const agentMatch = description?.match(/^(.*?)\s+(?:present|presents)\b/i);

    return {
      portal: this.portal,
      portalListingId,
      url: canonical,
      displayAddress: address && address.length >= 3 ? address.replace(/[,\s]+$/, '') : null,
      postcode: null,
      outcode: null,
      latitude: null,
      longitude: null,
      price,
      currency: 'GBP',
      propertyType: typeMatch ? typeMatch[1].trim() : null,
      bedrooms: bedMatch ? parseInt(bedMatch[1], 10) : null,
      bathrooms: null,
      description: description ?? null,
      agentName: agentMatch ? agentMatch[1].trim() : null,
      agentBranch: null,
      images: image ? [image] : [],
      source: 'fallback',
    };
  }
}
