import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { AgencyModule } from './modules/agency/agency.module';
import { UserModule } from './modules/user/user.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { ClientModule } from './modules/client/client.module';
import { BookingModule } from './modules/booking/booking.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { FineModule } from './modules/fine/fine.module';
import { PlanningModule } from './modules/planning/planning.module';
import { PaymentModule } from './modules/payment/payment.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AuditModule } from './modules/audit/audit.module';
import { AiModule } from './modules/ai/ai.module';
import { BusinessEventLogModule } from './modules/business-event-log/business-event-log.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { ModuleModule } from './modules/module/module.module';
import { BillingModule } from './modules/billing/billing.module';
import { PlanModule } from './modules/plan/plan.module';
import { UploadModule } from './modules/upload/upload.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { IncidentModule } from './modules/incident/incident.module';

// V2 Modules
import { ContractModule } from './modules/contract/contract.module';
import { JournalModule } from './modules/journal/journal.module';
import { GpsModule } from './modules/gps/gps.module';
import { InAppNotificationModule } from './modules/in-app-notification/in-app-notification.module';

// Common
import { PrismaModule } from './common/prisma/prisma.module';
import { ReadOnlyGuard } from './common/guards/read-only.guard';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests
      },
    ]),

    // Scheduler (Cron Jobs)
    ScheduleModule.forRoot(),

    // Database
    PrismaModule,

    // Business Modules
    AuthModule,
    CompanyModule,
    AgencyModule,
    UserModule,
    VehicleModule,
    ClientModule,
    BookingModule,
    MaintenanceModule,
    FineModule,
    PlanningModule,
    PaymentModule,
    NotificationModule,
    AuditModule,
    AiModule,
    BusinessEventLogModule,
    AnalyticsModule,
    SubscriptionModule,
    ModuleModule,
    BillingModule,
    PlanModule,
    UploadModule,
    InvoiceModule,
    IncidentModule,

    // V2 Modules
    ContractModule,
    JournalModule,
    GpsModule,
    InAppNotificationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ReadOnlyGuard,
    },
  ],
})
export class AppModule {}
