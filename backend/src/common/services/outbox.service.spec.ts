import { OutboxEventStatus } from '@prisma/client';
import { OutboxService } from './outbox.service';

describe('OutboxService', () => {
  const prisma = {
    outboxEvent: {
      create: jest.fn(),
      update: jest.fn(),
    },
  } as any;

  let service: OutboxService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OutboxService(prisma);
  });

  it('enqueue should create PENDING outbox event', async () => {
    prisma.outboxEvent.create.mockResolvedValue({ id: 'evt-1' });

    const id = await service.enqueue({
      aggregateType: 'Booking',
      aggregateId: 'b-1',
      eventType: 'BookingCreated',
      payload: { bookingId: 'b-1' },
      deduplicationKey: 'BookingCreated:b-1',
    });

    expect(id).toBe('evt-1');
    expect(prisma.outboxEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: OutboxEventStatus.PENDING,
          aggregateType: 'Booking',
          aggregateId: 'b-1',
          eventType: 'BookingCreated',
          deduplicationKey: 'BookingCreated:b-1',
        }),
      }),
    );
  });

  it('markProcessed should set PROCESSED and processedAt', async () => {
    prisma.outboxEvent.update.mockResolvedValue({});
    await service.markProcessed('evt-1');

    expect(prisma.outboxEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'evt-1' },
        data: expect.objectContaining({
          status: OutboxEventStatus.PROCESSED,
          processedAt: expect.any(Date),
          lastError: null,
          availableAt: expect.any(Date),
        }),
      }),
    );
  });

  it('scheduleRetry should keep PENDING, increment attempts and delay availableAt', async () => {
    prisma.outboxEvent.update.mockResolvedValue({});
    const before = Date.now();

    await service.scheduleRetry('evt-1', 'boom', 5000);

    const call = prisma.outboxEvent.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: 'evt-1' });
    expect(call.data.status).toBe(OutboxEventStatus.PENDING);
    expect(call.data.lastError).toBe('boom');
    expect(call.data.attempts).toEqual({ increment: 1 });
    expect(call.data.availableAt).toBeInstanceOf(Date);
    expect((call.data.availableAt as Date).getTime()).toBeGreaterThanOrEqual(before + 4900);
  });

  it('markDead should set FAILED and increment attempts', async () => {
    prisma.outboxEvent.update.mockResolvedValue({});
    await service.markDead('evt-1', 'final');

    expect(prisma.outboxEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'evt-1' },
        data: expect.objectContaining({
          status: OutboxEventStatus.FAILED,
          attempts: { increment: 1 },
          lastError: 'final',
          availableAt: expect.any(Date),
        }),
      }),
    );
  });
});

