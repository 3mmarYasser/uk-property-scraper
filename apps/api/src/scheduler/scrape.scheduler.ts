import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { RunTrigger } from '@ukps/database';
import { CronJob } from 'cron';
import { ScrapeProducer } from '../queue/scrape.producer';

/**
 * Registers the recurring crawl from the `SCRAPE_CRON` env value at startup.
 * Leaving `SCRAPE_CRON` blank disables scheduling (handy for local/demo use,
 * where runs are triggered manually via POST /scrape).
 */
@Injectable()
export class ScrapeScheduler implements OnModuleInit {
  private readonly logger = new Logger(ScrapeScheduler.name);

  constructor(
    private readonly producer: ScrapeProducer,
    private readonly config: ConfigService,
    private readonly registry: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    const cron = this.config.get<string>('scrape.cron') || '';
    if (!cron) {
      this.logger.log('SCRAPE_CRON not set — scheduled crawls disabled.');
      return;
    }

    const job = new CronJob(cron, () => {
      this.logger.log('Scheduled crawl firing.');
      this.producer
        .startRun({ trigger: RunTrigger.SCHEDULED })
        .catch((err) => this.logger.error(`Scheduled run failed to start: ${err.message}`));
    });

    this.registry.addCronJob('scheduled-crawl', job as any);
    job.start();
    this.logger.log(`Scheduled crawl registered with cron "${cron}".`);
  }
}
