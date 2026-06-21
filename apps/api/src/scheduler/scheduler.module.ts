import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { ScrapeScheduler } from './scrape.scheduler';

@Module({
  imports: [QueueModule],
  providers: [ScrapeScheduler],
})
export class SchedulerModule {}
