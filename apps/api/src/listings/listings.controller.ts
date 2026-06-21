import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ListingFilter, ListingsService } from './listings.service';

const toInt = (v: unknown): number | undefined => {
  if (v == null || v === '') return undefined;
  const n = parseInt(String(v), 10);
  return Number.isNaN(n) ? undefined : n;
};

@Controller('listings')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  /** Live market snapshot for the landing hero + price-movement ticker. */
  @Get('market/pulse')
  marketPulse() {
    return this.listings.marketPulse();
  }

  @Get()
  findMany(@Query() query: Record<string, string>) {
    const filter: ListingFilter = {
      minPrice: toInt(query.minPrice),
      maxPrice: toInt(query.maxPrice),
      bedrooms: toInt(query.bedrooms),
      propertyType: query.propertyType || undefined,
      outcode: query.outcode || undefined,
      status: query.status || undefined,
      q: query.q || undefined,
      page: Math.max(1, toInt(query.page) ?? 1),
      pageSize: Math.min(100, toInt(query.pageSize) ?? 24),
    };
    return this.listings.findMany(filter);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const listing = await this.listings.findOne(id);
    if (!listing) throw new NotFoundException(`Listing ${id} not found`);
    return listing;
  }

  @Get(':id/price-history')
  priceHistory(@Param('id') id: string) {
    return this.listings.priceHistory(id);
  }
}
