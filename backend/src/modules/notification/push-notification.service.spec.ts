import { PushNotificationService } from './push-notification.service';

describe('PushNotificationService', () => {
  let service: PushNotificationService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      deviceToken: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: { findMany: jest.fn() },
    };
    // Firebase won't be initialized without env vars
    service = new PushNotificationService(mockPrisma as any);
  });

  describe('registerToken', () => {
    it('should create a new device token', async () => {
      mockPrisma.deviceToken.findUnique.mockResolvedValue(null);
      mockPrisma.deviceToken.create.mockResolvedValue({ id: 'dt1', token: 'tok1', userId: 'u1', platform: 'android' });

      const result = await service.registerToken('u1', 'tok1', 'android');
      expect(result.id).toBe('dt1');
      expect(mockPrisma.deviceToken.create).toHaveBeenCalled();
    });

    it('should update existing token', async () => {
      mockPrisma.deviceToken.findUnique.mockResolvedValue({ id: 'dt1', token: 'tok1' });
      mockPrisma.deviceToken.update.mockResolvedValue({ id: 'dt1', token: 'tok1', userId: 'u2' });

      const result = await service.registerToken('u2', 'tok1', 'ios');
      expect(mockPrisma.deviceToken.update).toHaveBeenCalled();
    });
  });

  describe('unregisterToken', () => {
    it('should deactivate an existing token', async () => {
      mockPrisma.deviceToken.findUnique.mockResolvedValue({ id: 'dt1', token: 'tok1' });
      mockPrisma.deviceToken.update.mockResolvedValue({ id: 'dt1', isActive: false });

      await service.unregisterToken('tok1');
      expect(mockPrisma.deviceToken.update).toHaveBeenCalledWith({
        where: { token: 'tok1' },
        data: { isActive: false },
      });
    });

    it('should do nothing if token not found', async () => {
      mockPrisma.deviceToken.findUnique.mockResolvedValue(null);
      await service.unregisterToken('unknown');
      expect(mockPrisma.deviceToken.update).not.toHaveBeenCalled();
    });
  });

  describe('sendToUser', () => {
    it('should return 0/0 when Firebase not configured', async () => {
      mockPrisma.deviceToken.findMany.mockResolvedValue([]);
      const result = await service.sendToUser('u1', { title: 'Test', body: 'Hello' });
      expect(result).toEqual({ success: 0, failed: 0 });
    });
  });

  describe('isConfigured', () => {
    it('should return false when Firebase not initialized', () => {
      expect(service.isConfigured()).toBe(false);
    });
  });
});
