import { Test, TestingModule } from '@nestjs/testing';
import { InAppNotificationService } from './in-app-notification.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('InAppNotificationService', () => {
  let service: InAppNotificationService;
  let prismaService: any;

  const mockPrismaService = {
    inAppNotification: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InAppNotificationService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<InAppNotificationService>(InAppNotificationService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create notification in DRAFT status', async () => {
      mockPrismaService.inAppNotification.create.mockResolvedValue({
        id: 'notif-1',
        status: 'DRAFT',
        type: 'CONTRACT_TO_SIGN',
        title: 'Contrat à signer',
      });

      const result = await service.createNotification({
        userId: 'user-1',
        type: 'CONTRACT_TO_SIGN',
        title: 'Contrat à signer',
        message: 'Veuillez signer le contrat',
      });

      expect(result.status).toBe('DRAFT');
    });

    it('should create notification in SCHEDULED status if scheduledAt is provided', async () => {
      const scheduledAt = new Date('2026-01-10');
      mockPrismaService.inAppNotification.create.mockResolvedValue({
        id: 'notif-2',
        status: 'SCHEDULED',
        scheduledAt,
      });

      const result = await service.createNotification({
        userId: 'user-1',
        type: 'CHECK_OUT_REMINDER',
        title: 'Rappel',
        message: 'Check-out demain',
        scheduledAt,
      });

      expect(result.status).toBe('SCHEDULED');
    });
  });

  describe('sendNotification', () => {
    it('should mark notification as SENT', async () => {
      mockPrismaService.inAppNotification.findUnique.mockResolvedValue({
        id: 'notif-1',
        status: 'DRAFT',
      });
      mockPrismaService.inAppNotification.update.mockResolvedValue({
        id: 'notif-1',
        status: 'SENT',
        sentAt: new Date(),
      });

      const result = await service.sendNotification('notif-1');

      expect(result.status).toBe('SENT');
      expect(result.sentAt).toBeDefined();
    });

    it('should throw if notification not found', async () => {
      mockPrismaService.inAppNotification.findUnique.mockResolvedValue(null);

      await expect(service.sendNotification('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as READ', async () => {
      mockPrismaService.inAppNotification.findUnique.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        status: 'SENT',
      });
      mockPrismaService.inAppNotification.update.mockResolvedValue({
        id: 'notif-1',
        status: 'READ',
        readAt: new Date(),
      });

      const result = await service.markAsRead('notif-1', 'user-1');

      expect(result.status).toBe('READ');
      expect(result.readAt).toBeDefined();
    });

    it('should throw if notification belongs to different user', async () => {
      mockPrismaService.inAppNotification.findUnique.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-2',
      });

      await expect(service.markAsRead('notif-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all SENT notifications as READ', async () => {
      mockPrismaService.inAppNotification.updateMany.mockResolvedValue({
        count: 5,
      });

      const result = await service.markAllAsRead('user-1');

      expect(result).toBe(5);
      expect(mockPrismaService.inAppNotification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          status: 'SENT',
        },
        data: expect.objectContaining({
          status: 'READ',
        }),
      });
    });
  });

  describe('findByUser', () => {
    it('should return notifications for user', async () => {
      mockPrismaService.inAppNotification.findMany.mockResolvedValue([
        { id: 'n1' },
        { id: 'n2' },
      ]);

      const result = await service.findByUser('user-1');

      expect(result).toHaveLength(2);
    });

    it('should filter by status', async () => {
      mockPrismaService.inAppNotification.findMany.mockResolvedValue([]);

      await service.findByUser('user-1', { status: 'SENT' });

      expect(mockPrismaService.inAppNotification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'SENT' }),
        }),
      );
    });

    it('should filter unread only', async () => {
      mockPrismaService.inAppNotification.findMany.mockResolvedValue([]);

      await service.findByUser('user-1', { unreadOnly: true });

      expect(mockPrismaService.inAppNotification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['DRAFT', 'SENT'] },
          }),
        }),
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      mockPrismaService.inAppNotification.count.mockResolvedValue(3);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(3);
    });
  });

  describe('processScheduledNotifications', () => {
    it('should process scheduled notifications past their time', async () => {
      mockPrismaService.inAppNotification.updateMany.mockResolvedValue({
        count: 2,
      });

      const result = await service.processScheduledNotifications();

      expect(result).toBe(2);
      expect(mockPrismaService.inAppNotification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'SCHEDULED',
          }),
        }),
      );
    });
  });
});
