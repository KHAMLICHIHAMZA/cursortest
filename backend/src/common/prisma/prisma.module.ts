import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaSoftDeleteService } from './prisma-soft-delete.service';
import { PermissionService } from '../services/permission.service';
import { PaginationService } from '../services/pagination.service';
import { AuditService } from '../services/audit.service';

@Global()
@Module({
  providers: [
    PrismaService,
    PrismaSoftDeleteService,
    PermissionService,
    PaginationService,
    AuditService,
  ],
  exports: [
    PrismaService,
    PrismaSoftDeleteService,
    PermissionService,
    PaginationService,
    AuditService,
  ],
})
export class PrismaModule {}



