import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * ChatbotService - Chatbot IA pour clients
 * 
 * Règles :
 * - Discret (icône flottante)
 * - FAQ
 * - Aide réservation
 * - Aucune décision automatique
 * - Escalade : WhatsApp, téléphone, email
 */
@Injectable()
export class ChatbotService {
  private openaiApiKey: string;
  private openaiApiUrl: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.openaiApiUrl = this.configService.get<string>('OPENAI_API_URL') || 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * Répondre à une question du client
   */
  async answerQuestion(
    question: string,
    context?: {
      userId?: string;
      companyId?: string;
      agencyId?: string;
      bookingId?: string;
    },
  ): Promise<{
    answer: string;
    needsEscalation: boolean;
    escalationType?: 'whatsapp' | 'phone' | 'email';
    escalationContact?: string;
  }> {
    if (!this.openaiApiKey) {
      return {
        answer: 'Service temporairement indisponible. Veuillez nous contacter directement.',
        needsEscalation: true,
        escalationType: 'email',
      };
    }

    try {
      // Construire le contexte système
      const systemPrompt = `Tu es l'assistant virtuel de MalocAuto, un service de location de véhicules au Maroc.
Tu dois :
- Répondre aux questions sur les réservations, véhicules, tarifs
- Aider avec la FAQ
- Être poli et professionnel
- Ne JAMAIS prendre de décisions automatiques (réservation, annulation, etc.)
- Proposer l'escalade vers un humain si la question est complexe ou nécessite une action

Si la question nécessite une action (réservation, modification, annulation), propose l'escalade.`;

      // Récupérer le contexte si disponible
      let contextInfo = '';
      if (context?.bookingId) {
        const booking = await this.prisma.booking.findUnique({
          where: { id: context.bookingId },
          include: {
            agency: true,
            vehicle: true,
          },
        });

        if (booking) {
          contextInfo = `Contexte : Réservation ${booking.id}, Agence ${booking.agency.name}, Véhicule ${booking.vehicle.brand} ${booking.vehicle.model}`;
        }
      }

      const response = await fetch(this.openaiApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `${contextInfo}\n\nQuestion: ${question}` },
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      });

      const data = await response.json();
      const answer = data.choices[0].message.content;

      // Détecter si escalade nécessaire
      const needsEscalation =
        answer.toLowerCase().includes('contactez') ||
        answer.toLowerCase().includes('appelez') ||
        answer.toLowerCase().includes('écrivez') ||
        question.toLowerCase().includes('réserver') ||
        question.toLowerCase().includes('annuler') ||
        question.toLowerCase().includes('modifier');

      // Récupérer les contacts d'escalade si nécessaire
      let escalationType: 'whatsapp' | 'phone' | 'email' | undefined;
      let escalationContact: string | undefined;

      if (needsEscalation && context?.agencyId) {
        const agency = await this.prisma.agency.findUnique({
          where: { id: context.agencyId },
        });

        if (agency) {
          escalationType = agency.phone ? 'phone' : 'email';
          escalationContact = agency.phone || '';
        }
      }

      return {
        answer,
        needsEscalation,
        escalationType,
        escalationContact,
      };
    } catch (error) {
      console.error('Chatbot error:', error);
      return {
        answer: 'Désolé, je n\'ai pas pu traiter votre question. Veuillez nous contacter directement.',
        needsEscalation: true,
        escalationType: 'email',
      };
    }
  }

  /**
   * Obtenir les questions fréquentes
   */
  async getFAQ(): Promise<Array<{ question: string; answer: string }>> {
    return [
      {
        question: 'Comment réserver un véhicule ?',
        answer: 'Vous pouvez réserver un véhicule directement sur notre site en sélectionnant vos dates et le véhicule de votre choix. Pour toute assistance, n\'hésitez pas à nous contacter.',
      },
      {
        question: 'Quels documents sont nécessaires ?',
        answer: 'Vous devez présenter votre permis de conduire valide et une pièce d\'identité. Pour certaines locations, une caution peut être demandée.',
      },
      {
        question: 'Puis-je annuler ma réservation ?',
        answer: 'Oui, vous pouvez annuler votre réservation. Les conditions d\'annulation dépendent de votre contrat. Contactez-nous pour plus d\'informations.',
      },
      {
        question: 'Quels sont les moyens de paiement acceptés ?',
        answer: 'Nous acceptons les paiements en ligne par carte bancaire, ainsi que les paiements en espèces directement en agence.',
      },
    ];
  }
}

