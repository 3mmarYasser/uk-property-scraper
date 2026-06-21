/**
 * One-shot scrape for demos and CI: boots the Nest application context (so the
 * BullMQ workers are live), starts a single MANUAL run, waits for it to finish,
 * prints a summary, and exits.
 *
 *   pnpm scrape:once            # uses SCRAPE_LOCATION / SCRAPE_MAX_PAGES
 *   pnpm scrape:once -- bristol 1
 */
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ScrapeProducer } from '../queue/scrape.producer';
import { RunsService } from '../runs/runs.service';

async function main(): Promise<void> {
  const logger = new Logger('scrape:once');
  const [location, maxPagesArg] = process.argv.slice(2);

  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: false });
  const producer = app.get(ScrapeProducer);
  const runs = app.get(RunsService);

  const { runId } = await producer.startRun({
    location: location || undefined,
    maxPages: maxPagesArg ? parseInt(maxPagesArg, 10) : undefined,
  });
  logger.log(`Run ${runId} started — waiting for completion...`);

  const deadline = Date.now() + 5 * 60 * 1000; // 5-minute safety timeout
  let run = await runs.findOne(runId);
  while (run && run.status === 'RUNNING' && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000));
    run = await runs.findOne(runId);
  }

  if (run) {
    logger.log(
      `Run ${run.status} — found=${run.listingsFound} new=${run.listingsNew} ` +
        `updated=${run.listingsUpdated} priceChanges=${run.priceChanges} errors=${run.errorCount}`,
    );
    if (run.fieldQuality.length) {
      logger.log('Field null-rates:');
      for (const fq of run.fieldQuality) {
        logger.log(`  ${fq.field.padEnd(16)} ${(fq.nullRate * 100).toFixed(1)}% (${fq.nullCount}/${fq.totalCount})`);
      }
    }
  }

  await app.close();
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
