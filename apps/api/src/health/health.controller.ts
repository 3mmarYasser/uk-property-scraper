import { Controller, Get } from '@nestjs/common';
import { RunsService } from '../runs/runs.service';

@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(private readonly runs: RunsService) {}

  /** Liveness — is the API process up? */
  @Get()
  liveness() {
    return {
      status: 'ok',
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
    };
  }

  /**
   * Pipeline health — has the scraper run successfully recently? This is the
   * endpoint a dead-man's-switch / uptime monitor should poll to detect a
   * silently-stopped scraper (see docs/production.md → "Detect silent stop").
   */
  @Get('pipeline')
  pipeline() {
    return this.runs.pipelineHealth();
  }
}
