import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionService } from './subscription.service';
import { BillingService } from '../billing/billing.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CompanyStatus, SubscriptionStatus, PaymentStatus } from '@prisma/client';

/**
 * Scheduler pour les tâches automatiques de facturation
 * 
 * Tâches :
 * - Vérification des abonnements expirés (quotidien)
 * - Génération des factures récurrentes (quotidien)
 * - Suspension automatique (quotidien)
 * - Suppression définitive J+100 (quotidien)
 */
@Injectable()
export class SubscriptionScheduler {
  private readonly logger = new Logger(SubscriptionScheduler.name);

  constructor(
    private subscriptionService: SubscriptionService,
    private billingService: BillingService,
    private prisma: PrismaService,
  ) {}

  /**
   * Vérifier les abonnements expirés et les suspendre
   * Exécuté tous les jours à 2h du matin
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async checkExpiredSubscriptions() {
    this.logger.log('Checking expired subscriptions...');
    const count = await this.subscriptionService.checkExpiredSubscriptions();
    this.logger.log(`${count} subscriptions expired and suspended`);
  }

  /**
   * Générer les factures récurrentes
   * Exécuté tous les jours à 3h du matin
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async generateRecurringInvoices() {
    this.logger.log('Generating recurring invoices...');
    
    try {
      // Récupérer tous les abonnements actifs
      const activeSubscriptions = await this.prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
        },
        include: {
          paymentsSaas: {
            where: {
              status: PaymentStatus.PENDING,
            },
            orderBy: {
              dueDate: 'desc',
            },
            take: 1,
          },
        },
      });
      
      let invoicesGenerated = 0;
      
      for (const subscription of activeSubscriptions) {
        // Vérifier si une facture en attente existe déjà pour cette période
        const hasPendingInvoice = subscription.paymentsSaas && subscription.paymentsSaas.length > 0;
        
        if (hasPendingInvoice) {
          continue; // Facture déjà générée
        }
        
        // Générer une facture 7 jours avant l'échéance de l'abonnement
        const endDate = new Date(subscription.endDate);
        const sevenDaysBefore = new Date(endDate);
        sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        sevenDaysBefore.setHours(0, 0, 0, 0);
        
        // Si on est à 7 jours avant l'échéance, générer la facture
        if (today.getTime() >= sevenDaysBefore.getTime() && today.getTime() <= endDate.getTime()) {
          try {
            await this.billingService.generateInvoice(subscription.id);
            invoicesGenerated++;
          } catch (error) {
            this.logger.error(`Error generating invoice for subscription ${subscription.id}:`, error);
          }
        }
      }
      
      this.logger.log(`${invoicesGenerated} invoices generated`);
    } catch (error) {
      this.logger.error('Error in generateRecurringInvoices:', error);
    }
  }

  /**
   * Vérifier et supprimer définitivement les Companies suspendues depuis J+100
   * Exécuté tous les jours à 4h du matin
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async deleteExpiredCompanies() {
    this.logger.log('Checking companies for permanent deletion (J+100)...');
    
    try {
      const now = new Date();
      const hundredDaysAgo = new Date(now);
      hundredDaysAgo.setDate(hundredDaysAgo.getDate() - 100);
      
      // Récupérer les companies suspendues depuis plus de 100 jours
      const expiredCompanies = await this.prisma.company.findMany({
        where: {
          status: CompanyStatus.SUSPENDED,
          suspendedAt: {
            lte: hundredDaysAgo,
          },
        },
        include: {
          subscriptions: {
            where: {
              status: {
                in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.SUSPENDED],
              },
            },
          },
        },
      });
      
      let deletedCount = 0;
      
      for (const company of expiredCompanies) {
        try {
          // Annuler tous les abonnements actifs/suspendus
          for (const subscription of company.subscriptions) {
            await this.prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                status: SubscriptionStatus.CANCELLED,
                cancelledAt: now,
              },
            });
          }
          
          // Marquer la company comme DELETED (soft delete)
          await this.prisma.company.update({
            where: { id: company.id },
            data: {
              status: CompanyStatus.DELETED,
            },
          });
          
          deletedCount++;
          this.logger.log(`Company ${company.id} (${company.name}) permanently deleted`);
        } catch (error) {
          this.logger.error(`Error deleting company ${company.id}:`, error);
        }
      }
      
      this.logger.log(`${deletedCount} companies permanently deleted`);
    } catch (error) {
      this.logger.error('Error in deleteExpiredCompanies:', error);
    }
  }
}

