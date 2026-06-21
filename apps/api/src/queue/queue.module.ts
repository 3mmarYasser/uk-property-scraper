import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ListingsModule } from '../listings/listings.module';
import { RunsModule } from '../runs/runs.module';
import { ScraperModule } from '../scraper/scraper.module';
import { CrawlSearchProcessor } from './crawl-search.processor';
import { CRAWL_SEARCH_QUEUE, SCRAPE_LISTING_QUEUE } from './queue.constants';
import { RunTracker } from './run-tracker.service';
import { ScrapeController } from './scrape.controller';
import { ScrapeListingProcessor } from './scrape-listing.processor';
import { ScrapeProducer } from './scrape.producer';

@Module({
  imports: [
    ScraperModule,
    ListingsModule,
    RunsModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: CRAWL_SEARCH_QUEUE },
      { name: SCRAPE_LISTING_QUEUE },
    ),
  ],
  controllers: [ScrapeController],
  providers: [
    CrawlSearchProcessor,
    ScrapeListingProcessor,
    RunTracker,
    ScrapeProducer,
  ],
  exports: [ScrapeProducer],
})
export class QueueModule {}
