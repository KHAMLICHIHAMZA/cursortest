import { ConfigService } from '@nestjs/config';
import { OutboxEventStatus } from '@prisma/client';
import { OutboxDispatcher } from './outbox.dispatcher';
import { OutboxProcessor } from './outbox.processor';
import { OutboxService } from './outbox.service';

describe('OutboxProcessor', () => {
  const prisma = {
    $transaction: jest.fn(),
    outboxEvent: {
      findMany: jest.fn(),
    },
  } as any;

  const outboxService = {
    markProcessed: jest.fn(),
    scheduleRetry: jest.fn(),
    markDead: jest.fn(),
  } as unknown as OutboxService;

  const dispatcher = {
    dispatch: jest.fn(),
  } as unknown as OutboxDispatcher;

  const config = {
    get: jest.fn(),
  } as unknown as ConfigService;

  let processor: OutboxProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    (config.get as any).mockImplementation((key: string, def?: string) => def);
    processor = new OutboxProcessor(prisma, outboxService, dispatcher, config);
    // Ensure enabled in tests
    jest.spyOn<any, any>(processor as any, 'isEnabled').mockReturnValue(true);
    // Disable internal throttle
    (processor as any).lastRunAt = 0;
    jest.spyOn(Date, 'now').mockReturnValue(100000);
  });

  afterEach(() => {
    (Date.now as any).mockRestore?.();
  });

  it('should mark PROCESSED on successful dispatch', async () => {
    prisma.$transaction.mockResolvedValue([]); // no claim; fallback
    prisma.outboxEvent.findMany.mockResolvedValue([
      {
        id: 'evt-1',
        eventType: 'BookingCreated',
        aggregateType: 'Booking',
        aggregateId: 'b-1',
        payload: {},
        attempts: 0,
      },
    ]);
    (dispatcher.dispatch as any).mockResolvedValue(undefined);

    await processor.tick();

    expect(dispatcher.dispatch).toHaveBeenCalled();
    expect(outboxService.markProcessed).toHaveBeenCalledWith('evt-1');
  });

  it('should schedule retry on dispatch error under maxAttempts', async () => {
    prisma.$transaction.mockResolvedValue([]); // fallback
    prisma.outboxEvent.findMany.mockResolvedValue([
      {
        id: 'evt-1',
        eventType: 'Unknown',
        aggregateType: 'Booking',
        aggregateId: 'b-1',
        payload: {},
        attempts: 0,
      },
    ]);
    (dispatcher.dispatch as any).mockRejectedValue(new Error('boom'));

    // speed up config
    (config.get as any).mockImplementation((key: string, def?: string) => {
      if (key === 'OUTBOX_PROCESSOR_MAX_ATTEMPTS') return '3';
      if (key === 'OUTBOX_PROCESSOR_BASE_DELAY_MS') return '10';
      if (key === 'OUTBOX_PROCESSOR_MAX_DELAY_MS') return '1000';
      if (key === 'OUTBOX_PROCESSOR_INTERVAL_MS') return '0';
      if (key === 'OUTBOX_PROCESSOR_BATCH_SIZE') return '50';
      return def;
    });

    await processor.tick();

    expect(outboxService.scheduleRetry).toHaveBeenCalledWith('evt-1', 'boom', expect.any(Number));
    expect(outboxService.markDead).not.toHaveBeenCalled();
  });

  it('should mark DEAD when attempts reach maxAttempts', async () => {
    prisma.$transaction.mockResolvedValue([]); // fallback
    prisma.outboxEvent.findMany.mockResolvedValue([
      {
        id: 'evt-1',
        eventType: 'Unknown',
        aggregateType: 'Booking',
        aggregateId: 'b-1',
        payload: {},
        attempts: 9,
      },
    ]);
    (dispatcher.dispatch as any).mockRejectedValue(new Error('boom'));
    (config.get as any).mockImplementation((key: string, def?: string) => {
      if (key === 'OUTBOX_PROCESSOR_MAX_ATTEMPTS') return '10';
      if (key === 'OUTBOX_PROCESSOR_INTERVAL_MS') return '0';
      return def;
    });

    await processor.tick();

    expect(outboxService.markDead).toHaveBeenCalledWith('evt-1', 'boom');
  });

  it('should prefer claimed ids when claim succeeds', async () => {
    prisma.$transaction.mockResolvedValue(['evt-1', 'evt-2']);
    prisma.outboxEvent.findMany.mockResolvedValue([
      {
        id: 'evt-1',
        eventType: 'BookingCreated',
        aggregateType: 'Booking',
        aggregateId: 'b-1',
        payload: {},
        attempts: 0,
      },
    ]);
    (dispatcher.dispatch as any).mockResolvedValue(undefined);

    await processor.tick();

    expect(prisma.outboxEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['evt-1', 'evt-2'] } },
      }),
    );
  });

  it('should fallback to findMany PENDING when claim throws', async () => {
    prisma.$transaction.mockRejectedValue(new Error('no lock'));
    prisma.outboxEvent.findMany.mockResolvedValue([]);

    await processor.tick();

    expect(prisma.outboxEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: OutboxEventStatus.PENDING,
        }),
      }),
    );
  });
});

