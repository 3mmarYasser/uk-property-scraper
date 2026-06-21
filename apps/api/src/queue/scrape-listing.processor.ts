import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Portal, getAdapter, validateListing } from '@ukps/core';
import { Job } from 'bullmq';
import { BrowserService } from '../scraper/browser.service';
import { ListingsService } from '../listings/listings.service';
import { RunsService } from '../runs/runs.service';
import { SCRAPE_LISTING_QUEUE, ScrapeListingJob } from './queue.constants';
import { RunTracker } from './run-tracker.service';

/**
 * Consumer side: fetch one listing, extract + validate it, upsert it, and diff
 * its price. Concurrency and a per-worker rate limiter (politeness) are read
 * from config so the same code scales from a laptop to a fleet.
 *
 * NOTE: `@Processor` options are evaluated at decoration time, so the limiter is
 * sourced from env directly here (ConfigService is not yet available).
 */
@Processor(SCRAPE_LISTING_QUEUE, {
  concurrency: parseInt(process.env.SCRAPE_CONCURRENCY || '2', 10),
  limiter: {
    max: parseInt(process.env.SCRAPE_RATE_MAX || '5', 10),
    duration: parseInt(process.env.SCRAPE_RATE_DURATION_MS || '10000', 10),
  },
})
export class ScrapeListingProcessor extends WorkerHost {
  private readonly logger = new Logger(ScrapeListingProcessor.name);
  private readonly adapter = getAdapter(Portal.ONTHEMARKET);

  constructor(
    private readonly browser: BrowserService,
    private readonly listings: ListingsService,
    private readonly runs: RunsService,
    private readonly tracker: RunTracker,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<ScrapeListingJob>): Promise<{ id: string; isNew: boolean }> {
    const { runId, url } = job.data;
    const html = await this.browser.fetchHtml(url);
    const raw = this.adapter.parseListing(html, url);

    // Record data-quality once per listing (first attempt only, to avoid
    // double-counting across retries).
    if (job.attemptsMade === 0) {
      await this.tracker.recordQuality(runId, raw);
    }

    const validation = validateListing(raw);
    if (!validation.ok || !validation.listing) {
      throw new Error(`Validation failed for ${url}: ${validation.errors?.join('; ')}`);
    }

    const result = await this.listings.upsert(validation.listing);
    await this.runs.increment(runId, {
      ...(result.isNew ? { listingsNew: 1 } : { listingsUpdated: 1 }),
      ...(result.priceChanged ? { priceChanges: 1 } : {}),
    });

    return { id: result.id, isNew: result.isNew };
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<ScrapeListingJob>): Promise<void> {
    await this.tracker.completePending(job.data.runId);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<ScrapeListingJob>, err: Error): Promise<void> {
    if (this.isFinalAttempt(job)) {
      this.logger.warn(`Listing job failed permanently: ${job.data.url} — ${err.message}`);
      await this.runs.recordError(job.data.runId, `${job.data.url}: ${err.message}`);
      await this.tracker.completePending(job.data.runId);
    }
  }

  private isFinalAttempt(job: Job): boolean {
    return job.attemptsMade >= (job.opts.attempts ?? 1);
  }
}
