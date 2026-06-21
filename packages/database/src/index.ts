import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

/**
 * Lazily-created singleton PrismaClient for standalone scripts (seed, scrape:once).
 * NestJS uses its own PrismaService lifecycle and does not import this.
 */
let client: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  if (!client) {
    client = new PrismaClient();
  }
  return client;
}
