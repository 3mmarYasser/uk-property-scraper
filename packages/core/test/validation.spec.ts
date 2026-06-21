import { Portal, RawListing } from '../src/types';
import { validateListing, missingFields } from '../src/listing.schema';
import { parsePrice, deriveOutcode, stripHtml } from '../src/utils/html';

const base: RawListing = {
  portal: Portal.ONTHEMARKET,
  portalListingId: '123',
  url: 'https://www.onthemarket.com/details/123/',
  displayAddress: '1 Test Street, London',
  postcode: 'SW1A 1AA',
  outcode: 'SW1A',
  latitude: 51.5,
  longitude: -0.1,
  price: 450000,
  currency: 'GBP',
  propertyType: 'Flat',
  bedrooms: 2,
  bathrooms: 1,
  description: 'A nice flat.',
  agentName: 'Test Agent',
  agentBranch: null,
  images: ['https://media.onthemarket.com/a.jpg'],
  source: 'structured',
};

describe('validateListing', () => {
  it('accepts a well-formed listing', () => {
    expect(validateListing(base).ok).toBe(true);
  });

  it('rejects an absurd price (broken extraction)', () => {
    const result = validateListing({ ...base, price: 5 });
    expect(result.ok).toBe(false);
    expect(result.errors?.join()).toContain('price');
  });

  it('rejects a missing address', () => {
    expect(validateListing({ ...base, displayAddress: '' as unknown as string }).ok).toBe(false);
  });

  it('accepts incomplete-but-valid listings (null optional fields)', () => {
    expect(
      validateListing({ ...base, price: null, bedrooms: null, description: null }).ok,
    ).toBe(true);
  });
});

describe('missingFields', () => {
  it('reports null/empty tracked fields', () => {
    const missing = missingFields({ ...base, price: null, images: [] });
    expect(missing).toContain('price');
    expect(missing).toContain('images');
    expect(missing).not.toContain('displayAddress');
  });
});

describe('price/outcode/html utils', () => {
  it('parses a variety of price formats', () => {
    expect(parsePrice('£550,000')).toBe(550000);
    expect(parsePrice('550,000')).toBe(550000);
    expect(parsePrice('£550k')).toBe(550000);
    expect(parsePrice('Offers over £1.2m')).toBe(1200000);
    expect(parsePrice(450000)).toBe(450000);
    expect(parsePrice('POA')).toBeNull();
  });

  it('derives outcodes', () => {
    expect(deriveOutcode('SW18 1FQ')).toBe('SW18');
    expect(deriveOutcode('M1 2AB')).toBe('M1');
    expect(deriveOutcode('not a postcode')).toBeNull();
  });

  it('strips HTML descriptions to readable text', () => {
    expect(stripHtml('Line one<br/><br/>Line two')).toBe('Line one\n\nLine two');
    expect(stripHtml('<p>Hello &amp; welcome</p>')).toContain('Hello & welcome');
    expect(stripHtml('')).toBeNull();
  });
});
