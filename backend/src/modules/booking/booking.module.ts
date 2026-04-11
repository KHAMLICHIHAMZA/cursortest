import { Module } from "@nestjs/common";
import { BookingController } from "./booking.controller";
import { BookingService } from "./booking.service";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { PlanningModule } from "../planning/planning.module";
import { BusinessEventLogModule } from "../business-event-log/business-event-log.module";
import { AuditModule } from "../audit/audit.module";
import { InvoiceModule } from "../invoice/invoice.module";
import { ServicesModule } from "../../common/services/services.module";
import { ContractModule } from "../contract/contract.module";
import { InAppNotificationModule } from "../in-app-notification/in-app-notification.module";
import { JournalModule } from "../journal/journal.module";
import { BookingLifecycleScheduler } from "./booking-lifecycle.scheduler";

@Module({
  imports: [
    PrismaModule,
    PlanningModule,
    BusinessEventLogModule,
    AuditModule,
    InvoiceModule,
    ServicesModule,
    ContractModule,
    InAppNotificationModule,
    JournalModule,
  ],
  controllers: [BookingController],
  providers: [BookingService, BookingLifecycleScheduler],
  exports: [BookingService],
})
export class BookingModule {}
