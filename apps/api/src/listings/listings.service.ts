import { Injectable } from '@nestjs/common';
import {
  Portal,
  ValidatedListing,
  priceChangeType,
} from '@ukps/core';
import { Prisma } from '@ukps/database';
import { PrismaService } from '../prisma/prisma.service';

export interface UpsertResult {
  id: string;
  isNew: boolean;
  priceChanged: boolean;
}

export interface ListingFilter {
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  propertyType?: string;
  outcode?: string;
  status?: string;
  q?: string;
  page: number;
  pageSize: number;
}

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Upsert a listing keyed on (portal, portalListingId) and append a price-history
   * row only when the asking price has actually changed. Images are re-synced so
   * the gallery always reflects the latest scrape.
   */
  async upsert(listing: ValidatedListing): Promise<UpsertResult> {
    const where = {
      portal_portalListingId: {
        portal: listing.portal as Portal,
        portalListingId: listing.portalListingId,
      },
    };

    const existing = await this.prisma.property.findUnique({
      where,
      select: { id: true, price: true },
    });
    const isNew = !existing;
    const change = priceChangeType(existing?.price ?? null, listing.price, isNew);
    const now = new Date();

    const common = {
      url: listing.url,
      displayAddress: listing.displayAddress,
      postcode: listing.postcode,
      outcode: listing.outcode,
      latitude: listing.latitude,
      longitude: listing.longitude,
      price: listing.price,
      currency: listing.currency,
      propertyType: listing.propertyType,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      description: listing.description,
      agentName: listing.agentName,
      agentBranch: listing.agentBranch,
    };

    const priceHistoryCreate: Prisma.PriceHistoryCreateWithoutPropertyInput | undefined =
      change && listing.price != null
        ? { price: listing.price, changeType: change }
        : undefined;

    const property = await this.prisma.property.upsert({
      where,
      create: {
        portal: listing.portal as Portal,
        portalListingId: listing.portalListingId,
        ...common,
        firstSeenAt: now,
        lastSeenAt: now,
        lastScrapedAt: now,
        priceHistory: priceHistoryCreate ? { create: priceHistoryCreate } : undefined,
      },
      update: {
        ...common,
        status: 'ACTIVE',
        lastSeenAt: now,
        lastScrapedAt: now,
        priceHistory: priceHistoryCreate ? { create: priceHistoryCreate } : undefined,
      },
      select: { id: true },
    });

    // Re-sync images (delete + recreate) so removed photos do not linger.
    await this.prisma.$transaction([
      this.prisma.propertyImage.deleteMany({ where: { propertyId: property.id } }),
      this.prisma.propertyImage.createMany({
        data: listing.images.map((url, position) => ({
          propertyId: property.id,
          url,
          position,
        })),
        skipDuplicates: true,
      }),
    ]);

    return {
      id: property.id,
      isNew,
      priceChanged: change === 'INCREASE' || change === 'DECREASE',
    };
  }

  async findMany(filter: ListingFilter) {
    const where: Prisma.PropertyWhereInput = {};
    if (filter.minPrice != null || filter.maxPrice != null) {
      where.price = {};
      if (filter.minPrice != null) where.price.gte = filter.minPrice;
      if (filter.maxPrice != null) where.price.lte = filter.maxPrice;
    }
    if (filter.bedrooms != null) where.bedrooms = { gte: filter.bedrooms };
    if (filter.propertyType) where.propertyType = { contains: filter.propertyType, mode: 'insensitive' };
    if (filter.outcode) where.outcode = filter.outcode.toUpperCase();
    if (filter.status) where.status = filter.status as any;
    if (filter.q) {
      where.OR = [
        { displayAddress: { contains: filter.q, mode: 'insensitive' } },
        { agentName: { contains: filter.q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.property.count({ where }),
      this.prisma.property.findMany({
        where,
        orderBy: { lastScrapedAt: 'desc' },
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
        include: {
          images: { orderBy: { position: 'asc' }, take: 1 },
          // Latest change drives the "price drop" tag on cards.
          priceHistory: { orderBy: { recordedAt: 'desc' }, take: 1 },
        },
      }),
    ]);

    return { total, page: filter.page, pageSize: filter.pageSize, items };
  }

  findOne(
    id: string,
  ): Promise<Prisma.PropertyGetPayload<{ include: { images: true; priceHistory: true } }> | null> {
    return this.prisma.property.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: 'asc' } },
        priceHistory: { orderBy: { recordedAt: 'asc' } },
      },
    });
  }

  priceHistory(id: string) {
    return this.prisma.priceHistory.findMany({
      where: { propertyId: id },
      orderBy: { recordedAt: 'asc' },
    });
  }

  /**
   * Live market snapshot used by the landing hero + the price-movement ticker.
   * Surfaces the platform's "we are watching the market in real time" story.
   */
  async marketPulse() {
    const [totalActive, priceDrops, lastRun, changes] = await this.prisma.$transaction([
      this.prisma.property.count({ where: { status: 'ACTIVE' } }),
      this.prisma.priceHistory.count({ where: { changeType: 'DECREASE' } }),
      this.prisma.scrapeRun.findFirst({
        where: { status: 'SUCCESS' },
        orderBy: { finishedAt: 'desc' },
        select: { finishedAt: true },
      }),
      this.prisma.priceHistory.findMany({
        where: { changeType: { in: ['DECREASE', 'INCREASE'] } },
        orderBy: { recordedAt: 'desc' },
        take: 16,
        select: {
          id: true,
          price: true,
          changeType: true,
          recordedAt: true,
          property: { select: { id: true, outcode: true, displayAddress: true } },
        },
      }),
    ]);

    return { totalActive, priceDrops, lastSync: lastRun?.finishedAt ?? null, changes };
  }
}
