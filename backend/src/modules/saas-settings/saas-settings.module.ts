import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { SaasSettingsController } from './saas-settings.controller';
import { SaasSettingsService } from './saas-settings.service';

@Module({
  imports: [PrismaModule],
  controllers: [SaasSettingsController],
  providers: [SaasSettingsService],
  exports: [SaasSettingsService],
})
export class SaasSettingsModule {}

