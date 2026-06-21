/**
 * Optional seed: inserts a couple of hand-written sample listings plus a price
 * change, so the dashboard has something to render even before (or instead of)
 * a live scrape. Useful for demos where the portal is rate-limiting.
 *
 * Run with: pnpm --filter @ukps/database seed
 */
import { PrismaClient, PriceChangeType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const flat = await prisma.property.upsert({
    where: { portal_portalListingId: { portal: 'ONTHEMARKET', portalListingId: 'seed-0001' } },
    update: {},
    create: {
      portal: 'ONTHEMARKET',
      portalListingId: 'seed-0001',
      url: 'https://www.onthemarket.com/details/seed-0001/',
      displayAddress: '12 Example Street, London, SW1A 1AA',
      outcode: 'SW1A',
      postcode: 'SW1A 1AA',
      price: 525000,
      propertyType: 'Flat',
      bedrooms: 2,
      bathrooms: 1,
      description: 'A bright two-bedroom flat in the heart of Westminster, close to transport links.',
      agentName: 'Example Estates',
      agentBranch: 'Westminster',
      images: {
        create: [
          { url: 'https://picsum.photos/seed/ukps1/800/600', position: 0 },
          { url: 'https://picsum.photos/seed/ukps2/800/600', position: 1 },
        ],
      },
      priceHistory: {
        create: { price: 525000, changeType: PriceChangeType.INITIAL },
      },
    },
  });

  // Simulate a price drop a week later.
  await prisma.property.update({
    where: { id: flat.id },
    data: {
      price: 499950,
      priceHistory: {
        create: { price: 499950, changeType: PriceChangeType.DECREASE },
      },
    },
  });

  await prisma.property.upsert({
    where: { portal_portalListingId: { portal: 'ONTHEMARKET', portalListingId: 'seed-0002' } },
    update: {},
    create: {
      portal: 'ONTHEMARKET',
      portalListingId: 'seed-0002',
      url: 'https://www.onthemarket.com/details/seed-0002/',
      displayAddress: '5 Sample Road, Manchester, M1 2AB',
      outcode: 'M1',
      postcode: 'M1 2AB',
      price: 285000,
      propertyType: 'Terraced house',
      bedrooms: 3,
      bathrooms: 2,
      description: 'A well-presented three-bedroom terraced house with a private garden.',
      agentName: 'Northern Homes',
      agentBranch: 'City Centre',
      images: { create: [{ url: 'https://picsum.photos/seed/ukps3/800/600', position: 0 }] },
      priceHistory: { create: { price: 285000, changeType: PriceChangeType.INITIAL } },
    },
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
