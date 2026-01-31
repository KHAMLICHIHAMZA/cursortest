import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxEventStatus } from '@prisma/client';

export type OutboxEnqueueInput = {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: unknown;
  /**
   * Optional key to deduplicate event creation (idempotence).
   * If provided, must be unique (DB constraint).
   */
  deduplicationKey?: string;
};

@Injectable()
export class OutboxService {
  constructor(private readonly prisma: PrismaService) {}

  async enqueue(input: OutboxEnqueueInput) {
    const created = await this.prisma.outboxEvent.create({
      data: {
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        eventType: input.eventType,
        payload: input.payload as any,
        deduplicationKey: input.deduplicationKey,
        status: OutboxEventStatus.PENDING,
      },
      select: { id: true },
    });
    return created.id;
  }

  async markProcessed(id: string) {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: {
        status: OutboxEventStatus.PROCESSED,
        processedAt: new Date(),
        lastError: null,
      },
    });
  }

  async markFailed(id: string, errorMessage: string) {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: {
        status: OutboxEventStatus.FAILED,
        attempts: { increment: 1 },
        lastError: errorMessage,
      },
    });
  }
}

