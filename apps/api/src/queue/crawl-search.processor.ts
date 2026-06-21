import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Portal, getAdapter } from '@ukps/core';
import { Job, Queue } from 'bullmq';
import { BrowserService } from '../scraper/browser.service';
import { RunsService } from '../runs/runs.service';
import {
  CRAWL_SEARCH_QUEUE,
  CrawlSearchJob,
  SCRAPE_LISTING_QUEUE,
  ScrapeListingJob,
} from './queue.constants';
import { RunTracker } from './run-tracker.service';

/**
 * Producer side: fetch a search-results page, fan out one `scrape-listing` job
 * per listing, and follow pagination up to `maxPages`. This is the split that
 * makes horizontal scaling real — add workers and throughput rises.
 */
@Processor(CRAWL_SEARCH_QUEUE)
export class CrawlSearchProcessor extends WorkerHost {
  private readonly logger = new Logger(CrawlSearchProcessor.name);
  private readonly adapter = getAdapter(Portal.ONTHEMARKET);

  constructor(
    @InjectQueue(SCRAPE_LISTING_QUEUE) private readonly listingQueue: Queue<ScrapeListingJob>,
    @InjectQueue(CRAWL_SEARCH_QUEUE) private readonly crawlQueue: Queue<CrawlSearchJob>,
    private readonly browser: BrowserService,
    private readonly runs: RunsService,
    private readonly tracker: RunTracker,
  ) {
    super();
  }

  async process(job: Job<CrawlSearchJob>): Promise<{ found: number }> {
    const { runId, location, page, maxPages } = job.data;
    const url = this.adapter.buildSearchUrl(location, page);
    this.logger.log(`Crawling search page ${page}/${maxPages}: ${url}`);

    const html = await this.browser.fetchHtml(url);
    const { listingUrls, nextPageUrl } = this.adapter.parseSearchPage(html);

    await this.runs.increment(runId, {
      pagesCrawled: 1,
      listingsFound: listingUrls.length,
    });

    // Fan out listing jobs. Register pending work BEFORE we finish this job so
    // the run can never be considered "done" while children are still queued.
    for (const listingUrl of listingUrls) {
      await this.tracker.addPending(runId);
      await this.listingQueue.add(
        'scrape',
        { runId, url: listingUrl },
        { attempts: 3, backoff: { type: 'exponential', delay: 3000 }, removeOnComplete: 1000, removeOnFail: 1000 },
      );
    }

    if (page < maxPages && nextPageUrl) {
      await this.tracker.addPending(runId);
      await this.crawlQueue.add(
        'crawl',
        { runId, location, page: page + 1, maxPages },
        { attempts: 1, removeOnComplete: 100, removeOnFail: 100 },
      );
    }

    return { found: listingUrls.length };
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<CrawlSearchJob>): Promise<void> {
    await this.tracker.completePending(job.data.runId);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<CrawlSearchJob>, err: Error): Promise<void> {
    if (this.isFinalAttempt(job)) {
      await this.runs.recordError(job.data.runId, `crawl page ${job.data.page}: ${err.message}`);
      await this.tracker.completePending(job.data.runId);
    }
  }

  private isFinalAttempt(job: Job): boolean {
    return job.attemptsMade >= (job.opts.attempts ?? 1);
  }
}
