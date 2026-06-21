import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, RunStatus, RunTrigger } from '@ukps/database';
import { PrismaService } from '../prisma/prisma.service';

export interface FieldSnapshot {
  field: string;
  totalCount: number;
  nullCount: number;
  nullRate: number;
}

@Injectable()
export class RunsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  createRun(location: string, trigger: RunTrigger): Promise<{ id: string }> {
    return this.prisma.scrapeRun.create({
      data: { location, trigger, status: RunStatus.RUNNING },
      select: { id: true },
    });
  }

  /** Atomically bump counters on a run as work completes. */
  async increment(
    runId: string,
    fields: Partial<
      Record<
        'pagesCrawled' | 'listingsFound' | 'listingsNew' | 'listingsUpdated' | 'priceChanges' | 'errorCount',
        number
      >
    >,
  ): Promise<void> {
    const data: Prisma.ScrapeRunUpdateInput = {};
    for (const [key, value] of Object.entries(fields)) {
      (data as any)[key] = { increment: value };
    }
    await this.prisma.scrapeRun.update({ where: { id: runId }, data });
  }

  async recordError(runId: string, sample: string): Promise<void> {
    await this.prisma.scrapeRun.update({
      where: { id: runId },
      data: { errorCount: { increment: 1 }, errorSample: sample.slice(0, 500) },
    });
  }

  async finalize(runId: string, snapshots: FieldSnapshot[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.scrapeRun.update({
        where: { id: runId },
        data: { status: RunStatus.SUCCESS, finishedAt: new Date() },
      }),
      ...snapshots.map((s) =>
        this.prisma.fieldQualitySnapshot.upsert({
          where: { runId_field: { runId, field: s.field } },
          create: { runId, ...s },
          update: { totalCount: s.totalCount, nullCount: s.nullCount, nullRate: s.nullRate },
        }),
      ),
    ]);
  }

  async fail(runId: string, error: string): Promise<void> {
    await this.prisma.scrapeRun.update({
      where: { id: runId },
      data: { status: RunStatus.FAILED, finishedAt: new Date(), errorSample: error.slice(0, 500) },
    });
  }

  recent(take = 20) {
    return this.prisma.scrapeRun.findMany({
      orderBy: { startedAt: 'desc' },
      take,
      include: { fieldQuality: { orderBy: { field: 'asc' } } },
    });
  }

  findOne(
    id: string,
  ): Promise<Prisma.ScrapeRunGetPayload<{ include: { fieldQuality: true } }> | null> {
    return this.prisma.scrapeRun.findUnique({
      where: { id },
      include: { fieldQuality: { orderBy: { field: 'asc' } } },
    });
  }

  /** Health view: how long since the last SUCCESS, and recent throughput. */
  async pipelineHealth(maxAgeMinutes = this.config.get<number>('pipelineMaxAgeMinutes') ?? 720) {
    const lastSuccess = await this.prisma.scrapeRun.findFirst({
      where: { status: RunStatus.SUCCESS },
      orderBy: { finishedAt: 'desc' },
    });
    const lastAny = await this.prisma.scrapeRun.findFirst({ orderBy: { startedAt: 'desc' } });

    const ageMinutes = lastSuccess?.finishedAt
      ? Math.round((Date.now() - lastSuccess.finishedAt.getTime()) / 60000)
      : null;

    return {
      healthy: ageMinutes !== null && ageMinutes <= maxAgeMinutes,
      maxAgeMinutes,
      lastSuccessAt: lastSuccess?.finishedAt ?? null,
      lastSuccessAgeMinutes: ageMinutes,
      lastRunStatus: lastAny?.status ?? null,
      lastRunListingsFound: lastSuccess?.listingsFound ?? null,
      lastRunPriceChanges: lastSuccess?.priceChanges ?? null,
    };
  }
}
