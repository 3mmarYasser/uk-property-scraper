import { Module } from '@nestjs/common';
import { RunsModule } from '../runs/runs.module';
import { HealthController } from './health.controller';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Module({
  imports: [RunsModule],
  controllers: [HealthController, MetricsController],
  providers: [MetricsService],
})
export class HealthModule {}
