import { InvoicePdfService } from './invoice-pdf.service';

describe('InvoicePdfService', () => {
  let service: InvoicePdfService;

  beforeEach(() => {
    service = new InvoicePdfService();
  });

  const mockPayload = {
    version: 1,
    issuedAt: '2026-01-15T10:00:00+01:00',
    timezone: 'Africa/Casablanca',
    company: {
      id: 'comp1', name: 'MalocAuto', raisonSociale: 'MalocAuto SARL',
      identifiantLegal: 'ICE123456789', formeJuridique: 'SARL', address: 'Casablanca',
    },
    agency: { id: 'a1', name: 'Agence Casa', address: '123 Rue Test', phone: '+212600000000' },
    client: { id: 'cl1', name: 'Ahmed Test', email: 'ahmed@test.com', phone: '+212611111111', idCardNumber: 'AB123456', passportNumber: null },
    vehicle: { id: 'v1', brand: 'Dacia', model: 'Logan', registrationNumber: '12345-A-1' },
    booking: {
      id: 'b1', bookingNumber: 'LOC-2026-001',
      startDate: '2026-01-10T09:00:00Z', endDate: '2026-01-15T09:00:00Z',
      originalEndDate: null, extensionDays: null,
      totalPrice: 2500, lateFeeAmount: null,
      depositAmount: 1000, depositRequired: true, depositStatusFinal: 'COLLECTED',
    },
    amounts: { subtotal: 2500, lateFees: 0, total: 2500, currency: 'MAD' },
  };

  describe('generatePdf', () => {
    it('should generate a valid PDF buffer for INVOICE', async () => {
      const buffer = await service.generatePdf(mockPayload, 'FAC-2026-000001', 'INVOICE');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(100);
      // PDF starts with %PDF
      expect(buffer.slice(0, 5).toString()).toContain('%PDF');
    });

    it('should generate a valid PDF buffer for CREDIT_NOTE', async () => {
      const buffer = await service.generatePdf(mockPayload, 'AV-2026-000001', 'CREDIT_NOTE');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(100);
    });

    it('should include late fees when present', async () => {
      const payloadWithLateFees = {
        ...mockPayload,
        amounts: { subtotal: 2500, lateFees: 300, total: 2800, currency: 'MAD' },
      };
      const buffer = await service.generatePdf(payloadWithLateFees, 'FAC-2026-000002', 'INVOICE');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(100);
    });
  });
});
