import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RunTrigger } from '@ukps/database';
import { Queue } from 'bullmq';
import { RunsService } from '../runs/runs.service';
import { CRAWL_SEARCH_QUEUE, CrawlSearchJob } from './queue.constants';
import { RunTracker } from './run-tracker.service';

export interface StartRunOptions {
  location?: string;
  maxPages?: number;
  trigger?: RunTrigger;
}

@Injectable()
export class ScrapeProducer {
  private readonly logger = new Logger(ScrapeProducer.name);

  constructor(
    @InjectQueue(CRAWL_SEARCH_QUEUE) private readonly crawlQueue: Queue<CrawlSearchJob>,
    private readonly runs: RunsService,
    private readonly tracker: RunTracker,
    private readonly config: ConfigService,
  ) {}

  /** Open a ScrapeRun and seed the first search-crawl job. Returns the run id. */
  async startRun(opts: StartRunOptions = {}): Promise<{ runId: string; location: string }> {
    const location = opts.location ?? this.config.get<string>('scrape.location') ?? 'london';
    const maxPages = opts.maxPages ?? this.config.get<number>('scrape.maxPages') ?? 2;
    const trigger = opts.trigger ?? RunTrigger.MANUAL;

    const run = await this.runs.createRun(location, trigger);
    await this.tracker.addPending(run.id); // the initial crawl job
    await this.crawlQueue.add(
      'crawl',
      { runId: run.id, location, page: 1, maxPages },
      { attempts: 1, removeOnComplete: 100, removeOnFail: 100 },
    );

    this.logger.log(`Started run ${run.id} (${trigger}) for "${location}", maxPages=${maxPages}`);
    return { runId: run.id, location };
  }
}
