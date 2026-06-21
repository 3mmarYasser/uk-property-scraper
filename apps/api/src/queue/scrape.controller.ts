import { Body, Controller, Post } from '@nestjs/common';
import { RunTrigger } from '@ukps/database';
import { StartScrapeDto } from './dto/start-scrape.dto';
import { ScrapeProducer } from './scrape.producer';

@Controller('scrape')
export class ScrapeController {
  constructor(private readonly producer: ScrapeProducer) {}

  /** Manually kick off a scrape run (used in demos / the Loom). */
  @Post()
  async start(@Body() body: StartScrapeDto) {
    const { runId, location } = await this.producer.startRun({
      location: body.location,
      maxPages: body.maxPages,
      trigger: RunTrigger.MANUAL,
    });
    return { runId, location, status: 'queued' };
  }
}
