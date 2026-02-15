import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { InvoicePayload } from './invoice.service';

@Injectable()
export class InvoicePdfService {
  /**
   * Generate Invoice PDF from frozen payload (A4, Moroccan legal format)
   */
  async generatePdf(payload: InvoicePayload, invoiceNumber: string, type: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const isCredit = type === 'CREDIT_NOTE';
        const title = isCredit ? 'AVOIR' : 'FACTURE';

        // Compute duration
        const startDate = new Date(payload.booking.startDate);
        const endDate = new Date(payload.booking.endDate);
        const durationDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text(title, { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica').text(`N\u00b0 ${invoiceNumber}`, { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(9).text(`Date: ${this.formatDate(payload.issuedAt)}`, { align: 'center' });
        doc.moveDown(1.5);

        // Company info (left)
        const startY = doc.y;
        doc.fontSize(10).font('Helvetica-Bold').text('Emetteur:', 50);
        doc.fontSize(9).font('Helvetica');
        doc.text(payload.company.raisonSociale || payload.company.name);
        if (payload.company.identifiantLegal) {
          doc.text(`ICE: ${payload.company.identifiantLegal}`);
        }
        doc.text(`Forme juridique: ${payload.company.formeJuridique}`);
        if (payload.agency.address) doc.text(payload.agency.address);
        if (payload.agency.phone) doc.text(`Tel: ${payload.agency.phone}`);
        doc.text(`Agence: ${payload.agency.name}`);

        const leftEndY = doc.y;

        // Client info (right column)
        doc.y = startY;
        doc.fontSize(10).font('Helvetica-Bold').text('Client:', 320);
        doc.fontSize(9).font('Helvetica');
        doc.text(payload.client.name, 320);
        if (payload.client.email) doc.text(payload.client.email, 320);
        if (payload.client.phone) doc.text(`Tel: ${payload.client.phone}`, 320);
        if (payload.client.idCardNumber) doc.text(`CIN: ${payload.client.idCardNumber}`, 320);
        if (payload.client.passportNumber) doc.text(`Passeport: ${payload.client.passportNumber}`, 320);

        doc.y = Math.max(leftEndY, doc.y) + 20;

        // Line separator
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(1);

        // Booking details
        doc.fontSize(10).font('Helvetica-Bold').text('Details de la location:');
        doc.moveDown(0.5);
        doc.fontSize(9).font('Helvetica');
        if (payload.booking.bookingNumber) {
          doc.text(`N\u00b0 Reservation: ${payload.booking.bookingNumber}`);
        }
        doc.text(`Vehicule: ${payload.vehicle.brand} ${payload.vehicle.model} - ${payload.vehicle.registrationNumber}`);
        doc.text(`Du: ${this.formatDate(payload.booking.startDate)}  Au: ${this.formatDate(payload.booking.endDate)}`);
        doc.text(`Duree: ${durationDays} jour(s)`);
        doc.moveDown(1);

        // Pricing table
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.5);

        // Table header
        const tableTop = doc.y;
        const currency = payload.amounts?.currency || 'MAD';
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('Description', 50, tableTop, { width: 250 });
        doc.text('Qte', 310, tableTop, { width: 50, align: 'center' });
        doc.text(`P.U. (${currency})`, 370, tableTop, { width: 80, align: 'right' });
        doc.text(`Total (${currency})`, 460, tableTop, { width: 85, align: 'right' });
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.5);

        // Table row: Location
        doc.font('Helvetica').fontSize(9);
        const rowY = doc.y;
        const subtotal = payload.amounts.subtotal;
        const dailyRate = durationDays > 0 ? subtotal / durationDays : subtotal;
        doc.text(`Location vehicule (${durationDays}j)`, 50, rowY, { width: 250 });
        doc.text(`${durationDays}`, 310, rowY, { width: 50, align: 'center' });
        doc.text(`${dailyRate.toFixed(2)}`, 370, rowY, { width: 80, align: 'right' });
        doc.text(`${subtotal.toFixed(2)}`, 460, rowY, { width: 85, align: 'right' });
        doc.moveDown(1);

        // Late fees row if applicable
        if (payload.amounts.lateFees > 0) {
          const feeRowY = doc.y;
          doc.text('Frais de retard', 50, feeRowY, { width: 250 });
          doc.text('1', 310, feeRowY, { width: 50, align: 'center' });
          doc.text(`${payload.amounts.lateFees.toFixed(2)}`, 370, feeRowY, { width: 80, align: 'right' });
          doc.text(`${payload.amounts.lateFees.toFixed(2)}`, 460, feeRowY, { width: 85, align: 'right' });
          doc.moveDown(1);
        }

        // Separator
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.5);

        // Totals
        const totalsX = 370;
        doc.font('Helvetica').fontSize(9);
        doc.text('Sous-total:', totalsX, doc.y, { width: 80 });
        doc.text(`${subtotal.toFixed(2)} ${currency}`, 460, doc.y - doc.currentLineHeight(), { width: 85, align: 'right' });
        doc.moveDown(0.3);

        if (payload.amounts.lateFees > 0) {
          doc.text('Frais retard:', totalsX, doc.y, { width: 80 });
          doc.text(`${payload.amounts.lateFees.toFixed(2)} ${currency}`, 460, doc.y - doc.currentLineHeight(), { width: 85, align: 'right' });
          doc.moveDown(0.3);
        }

        doc.font('Helvetica-Bold').fontSize(11);
        doc.text('Total TTC:', totalsX, doc.y, { width: 80 });
        doc.text(`${payload.amounts.total.toFixed(2)} ${currency}`, 460, doc.y - doc.currentLineHeight(), { width: 85, align: 'right' });
        doc.moveDown(2);

        // Deposit info
        if (payload.booking.depositAmount && payload.booking.depositAmount > 0) {
          doc.font('Helvetica').fontSize(9);
          doc.text(`Caution: ${payload.booking.depositAmount.toFixed(2)} ${currency} (${payload.booking.depositStatusFinal || 'N/A'})`, 50);
          doc.moveDown(0.5);
        }

        // Footer
        doc.moveDown(2);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.5);
        doc.fontSize(8).font('Helvetica').fillColor('#666666');
        doc.text('Document genere par MalocAuto - Logiciel de gestion de location de vehicules', { align: 'center' });
        doc.text(`Devise: ${payload.amounts.currency} | Timezone: ${payload.timezone}`, { align: 'center' });
        if (isCredit) {
          doc.moveDown(0.3);
          doc.text('Ce document constitue un avoir sur la facture originale.', { align: 'center' });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private formatDate(isoDate: string): string {
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
        timeZone: 'Africa/Casablanca',
      });
    } catch {
      return isoDate;
    }
  }
}
