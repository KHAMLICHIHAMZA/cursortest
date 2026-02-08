import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { OutboxEventStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxService } from './outbox.service';
import { OutboxDispatcher } from './outbox.dispatcher';

@Injectable()
export class OutboxProcessor {
  private readonly logger = new Logger(OutboxProcessor.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxService: OutboxService,
    private readonly dispatcher: OutboxDispatcher,
    private readonly config: ConfigService,
  ) {}

  private isEnabled(): boolean {
    const nodeEnv = process.env.NODE_ENV || 'development';
    if (nodeEnv === 'test') return false;
    if (process.env.JEST_WORKER_ID) return false;
    return this.config.get('OUTBOX_PROCESSOR_ENABLED', 'true') !== 'false';
  }

  private get intervalMs(): number {
    const raw = this.config.get('OUTBOX_PROCESSOR_INTERVAL_MS', '2000');
    const ms = Number(raw);
    return Number.isFinite(ms) && ms > 0 ? ms : 2000;
  }

  private get batchSize(): number {
    const raw = this.config.get('OUTBOX_PROCESSOR_BATCH_SIZE', '50');
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.min(n, 500) : 50;
  }

  private get maxAttempts(): number {
    const raw = this.config.get('OUTBOX_PROCESSOR_MAX_ATTEMPTS', '10');
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.min(n, 100) : 10;
  }

  private get baseDelayMs(): number {
    const raw = this.config.get('OUTBOX_PROCESSOR_BASE_DELAY_MS', '2000');
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 2000;
  }

  private get maxDelayMs(): number {
    const raw = this.config.get('OUTBOX_PROCESSOR_MAX_DELAY_MS', '300000');
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 300000;
  }

  private computeBackoffMs(attemptNumber: number): number {
    // attemptNumber is 1-based (first failure => 1)
    const expo = Math.max(0, attemptNumber - 1);
    const delay = this.baseDelayMs * Math.pow(2, expo);
    return Math.min(delay, this.maxDelayMs);
  }

  @Interval(2000)
  async tick() {
    // Interval decorator value is static; we still gate frequency with config using a cheap check.
    if (!this.isEnabled()) return;
    if (this.isRunning) return;

    this.isRunning = true;
    try {
      await this.processOnce();
    } finally {
      this.isRunning = false;
    }
  }

  private lastRunAt = 0;
  private async processOnce() {
    const nowMs = Date.now();
    if (nowMs - this.lastRunAt < this.intervalMs) return;
    this.lastRunAt = nowMs;

    const now = new Date();

    // Idempotence + concurrency: claim a batch using a DB row lock (Postgres) and
    // move availableAt in the future so no other worker picks the same events.
    // If claim fails (non-Postgres), fall back to simple findMany.
    let claimedIds: string[] = [];
    try {
      const claimTtlSeconds = 60;
      claimedIds = await this.prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<{ id: string }[]>(
          Prisma.sql`
            SELECT id
            FROM "OutboxEvent"
            WHERE status = 'PENDING' AND "availableAt" <= ${now}
            ORDER BY "createdAt" ASC
            LIMIT ${this.batchSize}
            FOR UPDATE SKIP LOCKED
          `,
        );
        const ids = rows.map((r) => r.id);
        if (ids.length === 0) return [];

        await tx.$executeRaw(
          Prisma.sql`
            UPDATE "OutboxEvent"
            SET "availableAt" = ${new Date(now.getTime() + claimTtlSeconds * 1000)}
            WHERE id IN (${Prisma.join(ids)})
          `,
        );
        return ids;
      });
    } catch (e) {
      // Fallback: best-effort without locking
      this.logger.debug(`Outbox claim skipped (fallback mode): ${(e as any)?.message || e}`);
    }

    const events = await this.prisma.outboxEvent.findMany({
      where:
        claimedIds.length > 0
          ? { id: { in: claimedIds } }
          : { status: OutboxEventStatus.PENDING, availableAt: { lte: now } },
      orderBy: { createdAt: 'asc' },
      take: claimedIds.length > 0 ? undefined : this.batchSize,
      select: {
        id: true,
        eventType: true,
        aggregateType: true,
        aggregateId: true,
        payload: true,
        attempts: true,
      },
    });

    if (events.length === 0) return;

    for (const event of events) {
      try {
        await this.dispatcher.dispatch(event);
        await this.outboxService.markProcessed(event.id);
      } catch (err: any) {
        const msg = typeof err?.message === 'string' ? err.message : 'Unknown error';
        const attemptNumber = (event.attempts || 0) + 1;

        if (attemptNumber >= this.maxAttempts) {
          this.logger.error(
            `Outbox event failed permanently (id=${event.id}, type=${event.eventType}, attempts=${attemptNumber}): ${msg}`,
          );
          await this.outboxService.markDead(event.id, msg);
        } else {
          const delayMs = this.computeBackoffMs(attemptNumber);
          this.logger.warn(
            `Outbox event failed (id=${event.id}, type=${event.eventType}, attempt=${attemptNumber}/${this.maxAttempts}) retry in ${delayMs}ms: ${msg}`,
          );
          await this.outboxService.scheduleRetry(event.id, msg, delayMs);
        }
      }
    }
  }
}

