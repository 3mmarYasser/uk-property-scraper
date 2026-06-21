import { z } from 'zod';
import { Portal, RawListing, TRACKED_FIELDS, TrackedField } from './types';

/**
 * Validation for an extracted listing. This is deliberately strict on the few
 * fields a listing is worthless without (id, url, address) and lenient on the
 * rest, with sanity bounds that catch obviously-broken extraction (a £1 price,
 * 99 bedrooms) rather than rejecting merely-incomplete data.
 */
export const ListingSchema = z.object({
  portal: z.nativeEnum(Portal),
  portalListingId: z.string().min(1),
  url: z.string().url(),
  displayAddress: z.string().min(3),
  postcode: z.string().nullable(),
  outcode: z.string().nullable(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  price: z.number().int().min(1_000).max(50_000_000).nullable(),
  currency: z.string().default('GBP'),
  propertyType: z.string().nullable(),
  bedrooms: z.number().int().min(0).max(30).nullable(),
  bathrooms: z.number().int().min(0).max(30).nullable(),
  description: z.string().nullable(),
  agentName: z.string().nullable(),
  agentBranch: z.string().nullable(),
  images: z.array(z.string().url()),
  source: z.enum(['structured', 'fallback']),
});

export type ValidatedListing = z.infer<typeof ListingSchema>;

export interface ValidationResult {
  ok: boolean;
  listing?: ValidatedListing;
  errors?: string[];
}

export function validateListing(raw: RawListing): ValidationResult {
  const parsed = ListingSchema.safeParse(raw);
  if (parsed.success) {
    return { ok: true, listing: parsed.data };
  }
  return {
    ok: false,
    errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
  };
}

/** Is a tracked field considered "missing" for data-quality accounting? */
export function isFieldMissing(raw: RawListing, field: TrackedField): boolean {
  const value = raw[field];
  if (field === 'images') return !Array.isArray(value) || value.length === 0;
  return value == null || value === '';
}

/** Count missing tracked fields for one listing (used to build run-level metrics). */
export function missingFields(raw: RawListing): TrackedField[] {
  return TRACKED_FIELDS.filter((f) => isFieldMissing(raw, f));
}
