import { Injectable } from '@nestjs/common';
import { RunStatus } from '@ukps/database';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Emits a minimal Prometheus exposition. In production these would be backed by
 * a proper client (prom-client) and scraped by Prometheus; here we derive them
 * straight from the database so the monitoring story is demonstrable end-to-end.
 */
@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async render(): Promise<string> {
    const [totalProperties, activeProperties, totalRuns, lastSuccess] = await Promise.all([
      this.prisma.property.count(),
      this.prisma.property.count({ where: { status: 'ACTIVE' } }),
      this.prisma.scrapeRun.count(),
      this.prisma.scrapeRun.findFirst({
        where: { status: RunStatus.SUCCESS },
        orderBy: { finishedAt: 'desc' },
        include: { fieldQuality: true },
      }),
    ]);

    const lines: string[] = [];
    const metric = (name: string, help: string, value: number, labels = '') => {
      lines.push(`# HELP ${name} ${help}`);
      lines.push(`# TYPE ${name} gauge`);
      lines.push(`${name}${labels ? `{${labels}}` : ''} ${value}`);
    };

    metric('ukps_properties_total', 'Total properties stored.', totalProperties);
    metric('ukps_properties_active', 'Active properties.', activeProperties);
    metric('ukps_scrape_runs_total', 'Total scrape runs.', totalRuns);

    if (lastSuccess) {
      const ageSeconds = lastSuccess.finishedAt
        ? Math.round((Date.now() - lastSuccess.finishedAt.getTime()) / 1000)
        : -1;
      metric('ukps_last_success_age_seconds', 'Seconds since the last successful run.', ageSeconds);
      metric('ukps_last_run_listings_found', 'Listings found in the last successful run.', lastSuccess.listingsFound);
      metric('ukps_last_run_price_changes', 'Price changes detected in the last successful run.', lastSuccess.priceChanges);
      metric('ukps_last_run_errors', 'Errors in the last successful run.', lastSuccess.errorCount);

      for (const fq of lastSuccess.fieldQuality) {
        metric(
          'ukps_field_null_rate',
          'Null rate per field in the last successful run.',
          fq.nullRate,
          `field="${fq.field}"`,
        );
      }
    }

    return lines.join('\n') + '\n';
  }
}
