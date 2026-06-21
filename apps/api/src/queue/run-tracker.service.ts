import { Inject, Injectable, Logger } from '@nestjs/common';
import { RawListing, TRACKED_FIELDS, missingFields } from '@ukps/core';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';
import { FieldSnapshot, RunsService } from '../runs/runs.service';

/**
 * Tracks a scrape run's outstanding work in Redis so we can tell when a
 * distributed, fan-out run is actually *finished*.
 *
 * Every enqueued job increments a `pending` counter; every finished job (success
 * or final failure) decrements it. When it hits zero the run is finalised and
 * per-field data-quality snapshots are written from the accumulated counts.
 */
@Injectable()
export class RunTracker {
  private readonly logger = new Logger(RunTracker.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly runs: RunsService,
  ) {}

  private key(runId: string): string {
    return `ukps:run:${runId}`;
  }

  async addPending(runId: string, count = 1): Promise<void> {
    await this.redis.hincrby(this.key(runId), 'pending', count);
  }

  /** Decrement the pending counter; finalise the run when it reaches zero. */
  async completePending(runId: string): Promise<void> {
    const remaining = await this.redis.hincrby(this.key(runId), 'pending', -1);
    if (remaining <= 0) {
      await this.finalize(runId);
    }
  }

  /** Accumulate per-field "missing" counts for one extracted listing. */
  async recordQuality(runId: string, raw: RawListing): Promise<void> {
    const pipe = this.redis.pipeline();
    pipe.hincrby(this.key(runId), 'q:total', 1);
    for (const field of missingFields(raw)) {
      pipe.hincrby(this.key(runId), `q:${field}`, 1);
    }
    await pipe.exec();
  }

  private async finalize(runId: string): Promise<void> {
    const hash = await this.redis.hgetall(this.key(runId));
    const total = parseInt(hash['q:total'] || '0', 10);

    const snapshots: FieldSnapshot[] = TRACKED_FIELDS.map((field) => {
      const nullCount = parseInt(hash[`q:${field}`] || '0', 10);
      return {
        field,
        totalCount: total,
        nullCount,
        nullRate: total > 0 ? Number((nullCount / total).toFixed(4)) : 0,
      };
    });

    await this.runs.finalize(runId, snapshots);
    await this.redis.del(this.key(runId));
    this.logger.log(`Run ${runId} finalised (${total} listings processed).`);
  }
}
