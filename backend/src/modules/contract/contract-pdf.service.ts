import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

export interface ContractPayload {
  version: number;
  company: { name: string; raisonSociale: string; identifiantLegal: string | null; formeJuridique: string; address: string | null };
  agency: { name: string; address: string | null; phone: string | null };
  client: { name: string; email: string | null; phone: string | null; idCardNumber: string | null; passportNumber: string | null };
  vehicle: { brand: string; model: string; registrationNumber: string; year: number | null };
  booking: { bookingNumber: string; startDate: string; endDate: string; totalPrice: number; durationDays: number; depositAmount?: number };
  signatures?: {
    clientSignedAt?: string;
    agentSignedAt?: string;
    agentUserId?: string;
  };
}

@Injectable()
export class ContractPdfService {
  /**
   * Generate Contract PDF (A4)
   */
  async generatePdf(payload: ContractPayload, contractVersion: number, status: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title
        doc.fontSize(18).font('Helvetica-Bold').text('CONTRAT DE LOCATION DE VEHICULE', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica').text(`Version ${contractVersion} | Statut: ${status}`, { align: 'center' });
        doc.moveDown(1.5);

        // Article 1: Parties
        doc.fontSize(12).font('Helvetica-Bold').text('Article 1 - Les Parties');
        doc.moveDown(0.5);
        doc.fontSize(9).font('Helvetica');
        doc.text(`LE LOUEUR: ${payload.company.raisonSociale || payload.company.name}`);
        if (payload.company.identifiantLegal) doc.text(`ICE: ${payload.company.identifiantLegal}`);
        doc.text(`Forme juridique: ${payload.company.formeJuridique}`);
        doc.text(`Agence: ${payload.agency.name}`);
        if (payload.agency.address) doc.text(`Adresse: ${payload.agency.address}`);
        if (payload.agency.phone) doc.text(`Tel: ${payload.agency.phone}`);
        doc.moveDown(0.5);

        doc.text(`LE LOCATAIRE: ${payload.client.name}`);
        if (payload.client.idCardNumber) doc.text(`CIN: ${payload.client.idCardNumber}`);
        if (payload.client.passportNumber) doc.text(`Passeport: ${payload.client.passportNumber}`);
        if (payload.client.phone) doc.text(`Tel: ${payload.client.phone}`);
        if (payload.client.email) doc.text(`Email: ${payload.client.email}`);
        doc.moveDown(1);

        // Article 2: Vehicle
        doc.fontSize(12).font('Helvetica-Bold').text('Article 2 - Vehicule');
        doc.moveDown(0.5);
        doc.fontSize(9).font('Helvetica');
        doc.text(`Marque: ${payload.vehicle.brand}`);
        doc.text(`Modele: ${payload.vehicle.model}`);
        doc.text(`Immatriculation: ${payload.vehicle.registrationNumber}`);
        if (payload.vehicle.year) doc.text(`Annee: ${payload.vehicle.year}`);
        doc.moveDown(1);

        // Article 3: Duration & Price
        doc.fontSize(12).font('Helvetica-Bold').text('Article 3 - Duree et Tarif');
        doc.moveDown(0.5);
        doc.fontSize(9).font('Helvetica');
        if (payload.booking.bookingNumber) doc.text(`N° Reservation: ${payload.booking.bookingNumber}`);
        doc.text(`Date de debut: ${this.formatDate(payload.booking.startDate)}`);
        doc.text(`Date de fin: ${this.formatDate(payload.booking.endDate)}`);
        doc.text(`Duree: ${payload.booking.durationDays} jour(s)`);
        doc.text(`Montant total: ${payload.booking.totalPrice.toFixed(2)} MAD`);
        if (payload.booking.depositAmount) {
          doc.text(`Caution: ${payload.booking.depositAmount.toFixed(2)} MAD`);
        }
        doc.moveDown(1);

        // Article 4: Obligations
        doc.fontSize(12).font('Helvetica-Bold').text('Article 4 - Obligations du Locataire');
        doc.moveDown(0.5);
        doc.fontSize(9).font('Helvetica');
        doc.text('Le locataire s\'engage a:');
        doc.text('  - Utiliser le vehicule conformement a sa destination normale');
        doc.text('  - Restituer le vehicule dans l\'etat ou il l\'a recu');
        doc.text('  - Signaler immediatement tout incident ou dommage');
        doc.text('  - Ne pas sous-louer le vehicule');
        doc.text('  - Restituer le vehicule a la date convenue');
        doc.moveDown(1);

        // Article 5: Conditions
        doc.fontSize(12).font('Helvetica-Bold').text('Article 5 - Conditions Generales');
        doc.moveDown(0.5);
        doc.fontSize(9).font('Helvetica');
        doc.text('Tout retard de restitution entraine des frais supplementaires.');
        doc.text('En cas de sinistre, le locataire doit informer le loueur dans les 24 heures.');
        doc.text('Le present contrat est regi par le droit marocain.');
        doc.moveDown(1.5);

        // Signatures
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(1);
        doc.fontSize(11).font('Helvetica-Bold').text('Signatures');
        doc.moveDown(0.5);

        const sigY = doc.y;
        doc.fontSize(9).font('Helvetica');

        // Client signature
        doc.text('Le Locataire:', 50, sigY);
        if (payload.signatures?.clientSignedAt) {
          doc.text(`Signe le: ${this.formatDate(payload.signatures.clientSignedAt)}`, 50);
          doc.text('[Signature electronique]', 50);
        } else {
          doc.moveDown(2);
          doc.text('________________________', 50);
          doc.text('Signature', 50);
        }

        // Agent signature
        doc.y = sigY;
        doc.text('Le Loueur:', 320, sigY);
        if (payload.signatures?.agentSignedAt) {
          doc.text(`Signe le: ${this.formatDate(payload.signatures.agentSignedAt)}`, 320);
          doc.text('[Signature electronique]', 320);
        } else {
          doc.y = sigY + 30;
          doc.text('________________________', 320);
          doc.text('Signature', 320);
        }

        doc.moveDown(4);

        // Footer
        doc.fontSize(8).font('Helvetica').fillColor('#666666');
        doc.text('Document genere par MalocAuto - Ce contrat a valeur de preuve.', 50, undefined, { align: 'center' });
        doc.text('Devise: MAD (Dirham Marocain)', { align: 'center' });

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
