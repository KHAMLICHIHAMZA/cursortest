import { EmailNotificationService } from './email-notification.service';

describe('EmailNotificationService', () => {
  let service: EmailNotificationService;

  beforeEach(() => {
    // Without SMTP env vars, service is not configured
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    service = new EmailNotificationService();
  });

  describe('checkConfigured', () => {
    it('should return false when SMTP not configured', () => {
      expect(service.checkConfigured()).toBe(false);
    });
  });

  describe('sendInvoiceEmail', () => {
    it('should return false when SMTP not configured', async () => {
      const result = await service.sendInvoiceEmail({
        clientEmail: 'test@test.com',
        clientName: 'Test',
        invoiceNumber: 'FAC-001',
        amount: 2500,
      });
      expect(result).toBe(false);
    });
  });

  describe('sendContractEmail', () => {
    it('should return false when SMTP not configured', async () => {
      const result = await service.sendContractEmail({
        clientEmail: 'test@test.com',
        clientName: 'Test',
        vehicleInfo: 'Dacia Logan',
        startDate: '10/01/2026',
        endDate: '15/01/2026',
      });
      expect(result).toBe(false);
    });
  });

  describe('sendLateReturnEmail', () => {
    it('should return false when SMTP not configured', async () => {
      const result = await service.sendLateReturnEmail({
        agentEmail: 'agent@test.com',
        agentName: 'Agent',
        clientName: 'Client',
        vehicleInfo: 'Dacia Logan',
        expectedReturnDate: '15/01/2026',
        daysLate: 2,
      });
      expect(result).toBe(false);
    });
  });

  describe('sendCheckInReminder', () => {
    it('should return false when SMTP not configured', async () => {
      const result = await service.sendCheckInReminder({
        agentEmail: 'agent@test.com',
        agentName: 'Agent',
        clientName: 'Client',
        vehicleInfo: 'Dacia Logan',
        startDate: '10/01/2026',
      });
      expect(result).toBe(false);
    });
  });
});
