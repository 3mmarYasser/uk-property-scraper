import * as fs from 'fs';
import * as path from 'path';
import { OnTheMarketAdapter } from '../src/adapters/onthemarket.adapter';
import { validateListing } from '../src/listing.schema';

const fixture = (name: string) =>
  fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');

const detailHtml = fixture('onthemarket-detail.html');
const searchHtml = fixture('onthemarket-search.html');
const detailUrl = 'https://www.onthemarket.com/details/18053674/';

describe('OnTheMarketAdapter — search page', () => {
  const adapter = new OnTheMarketAdapter();

  it('builds paginated search URLs', () => {
    expect(adapter.buildSearchUrl('london', 1)).toBe(
      'https://www.onthemarket.com/for-sale/property/london/',
    );
    expect(adapter.buildSearchUrl('london', 3)).toBe(
      'https://www.onthemarket.com/for-sale/property/london/?page=3',
    );
  });

  it('extracts listing detail URLs and the next-page link', () => {
    const result = adapter.parseSearchPage(searchHtml);
    expect(result.listingUrls.length).toBeGreaterThanOrEqual(20);
    expect(result.listingUrls).toContain(detailUrl);
    result.listingUrls.forEach((u) =>
      expect(u).toMatch(/^https:\/\/www\.onthemarket\.com\/details\/\d+\/$/),
    );
    expect(result.nextPageUrl).toBe(
      'https://www.onthemarket.com/for-sale/property/london/?page=2',
    );
  });
});

describe('OnTheMarketAdapter — structured listing extraction', () => {
  const adapter = new OnTheMarketAdapter();
  const listing = adapter.parseListing(detailHtml, detailUrl);

  it('uses the structured (__NEXT_DATA__) path', () => {
    expect(listing.source).toBe('structured');
  });

  it('extracts every required field', () => {
    expect(listing.portalListingId).toBe('18053674');
    expect(listing.url).toBe(detailUrl);
    expect(listing.displayAddress).toBe('Riverside Quarter, Wandsworth, SW18');
    expect(listing.price).toBe(550000);
    expect(listing.propertyType).toBe('Flat');
    expect(listing.bedrooms).toBe(2);
    expect(listing.bathrooms).toBe(2);
    expect(listing.agentName).toBe('RiverHomes - South West & Central London Branch');
    expect(listing.description).toContain('Riverside Quarter');
    expect(listing.images.length).toBe(27);
    listing.images.forEach((u) => expect(u).toMatch(/^https:\/\/media\.onthemarket\.com\//));
  });

  it('derives postcode and outcode', () => {
    expect(listing.postcode).toBe('SW18 1FQ');
    expect(listing.outcode).toBe('SW18');
  });

  it('passes schema validation', () => {
    const result = validateListing(listing);
    expect(result.ok).toBe(true);
  });
});

describe('OnTheMarketAdapter — edge cases', () => {
  const adapter = new OnTheMarketAdapter();

  it('returns an empty result for a search page with no listings', () => {
    const html = '<html><body><h1>No properties found</h1></body></html>';
    const result = adapter.parseSearchPage(html);
    expect(result.listingUrls).toEqual([]);
    expect(result.nextPageUrl).toBeNull();
  });

  it('handles a POA listing (no advertised price) without inventing one', () => {
    const property = {
      id: '999001',
      canonicalUrl: 'https://www.onthemarket.com/details/999001/',
      displayAddress: '1 Test Road, Manchester, M1',
      priceRaw: null,
      humanisedPropertyType: 'Flat',
      bedrooms: 1,
      bathrooms: 1,
      description: 'A flat available on application.',
      agent: { name: 'Test Agent' },
      images: [{ largeUrl: 'https://media.onthemarket.com/x.jpg' }],
    };
    const html = `<html><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(
      { props: { initialReduxState: { property, metadata: { dataLayer: { postcode: 'M1 1AA' } } } } },
    )}</script></body></html>`;

    const listing = adapter.parseListing(html, property.canonicalUrl);
    expect(listing.source).toBe('structured');
    expect(listing.price).toBeNull();
    expect(listing.outcode).toBe('M1');
    // A priceless listing is still valid (price is nullable, the rest is present).
    expect(validateListing(listing).ok).toBe(true);
  });
});

describe('OnTheMarketAdapter — fallback path', () => {
  const adapter = new OnTheMarketAdapter();

  it('reconstructs a degraded listing from OG meta when __NEXT_DATA__ is gone', () => {
    // Simulate a structural site change that breaks the structured path.
    const broken = detailHtml.replace(
      /<script id="__NEXT_DATA__"[\s\S]*?<\/script>/,
      '',
    );
    const listing = adapter.parseListing(broken, detailUrl);

    expect(listing.source).toBe('fallback');
    expect(listing.portalListingId).toBe('18053674');
    expect(listing.price).toBe(550000);
    expect(listing.bedrooms).toBe(2);
    expect(listing.propertyType).toBe('flat');
    expect(listing.agentName).toContain('RiverHomes');
    expect(listing.images.length).toBeGreaterThanOrEqual(1);
    // Even degraded, it should still be a valid listing.
    expect(validateListing(listing).ok).toBe(true);
  });
});
