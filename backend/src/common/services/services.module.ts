import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { FileStorageService } from './file-storage.service';
import { AIVisionService } from './ai-vision.service';
import { PermissionService } from './permission.service';
import { OutboxService } from './outbox.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

/**
 * Common Services Module
 * 
 * Provides shared services used across the application:
 * - AuditService: Audit field management
 * - FileStorageService: Abstract file storage (local/S3-ready)
 * - AIVisionService: Abstract AI vision provider (OpenAI/Google-ready)
 * - PermissionService: Permission and access control
 */
@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [AuditService, FileStorageService, AIVisionService, PermissionService, OutboxService],
  exports: [AuditService, FileStorageService, AIVisionService, PermissionService, OutboxService],
})
export class ServicesModule {}



