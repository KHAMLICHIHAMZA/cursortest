import { ContractPdfService } from './contract-pdf.service';

describe('ContractPdfService', () => {
  let service: ContractPdfService;

  beforeEach(() => {
    service = new ContractPdfService();
  });

  const mockPayload = {
    version: 1,
    company: { name: 'MalocAuto', raisonSociale: 'MalocAuto SARL', identifiantLegal: 'ICE123456789', formeJuridique: 'SARL', address: 'Casablanca' },
    agency: { name: 'Agence Casa', address: '123 Rue Test', phone: '+212600000000' },
    client: { name: 'Ahmed Test', email: 'ahmed@test.com', phone: '+212611111111', idCardNumber: 'AB123456', passportNumber: null },
    vehicle: { brand: 'Dacia', model: 'Logan', registrationNumber: '12345-A-1', year: 2024 },
    booking: { bookingNumber: 'LOC-2026-001', startDate: '2026-01-10T09:00:00Z', endDate: '2026-01-15T09:00:00Z', totalPrice: 2500, durationDays: 5, depositAmount: 1000 },
    signatures: undefined as any,
  };

  describe('generatePdf', () => {
    it('should generate a valid PDF buffer for DRAFT contract', async () => {
      const buffer = await service.generatePdf(mockPayload, 1, 'DRAFT');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(100);
      expect(buffer.slice(0, 5).toString()).toContain('%PDF');
    });

    it('should generate PDF with signatures', async () => {
      const signedPayload = {
        ...mockPayload,
        signatures: {
          clientSignedAt: '2026-01-10T10:00:00Z',
          agentSignedAt: '2026-01-10T10:05:00Z',
          agentUserId: 'u1',
        },
      };
      const buffer = await service.generatePdf(signedPayload, 1, 'SIGNED');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(100);
    });

    it('should handle version 2+ contracts', async () => {
      const buffer = await service.generatePdf(mockPayload, 3, 'PENDING_SIGNATURE');
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });
});
