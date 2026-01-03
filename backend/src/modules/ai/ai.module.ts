import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { DamageDetectionService } from './damage-detection.service';
import { ChatbotService } from './chatbot.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [AiService, DamageDetectionService, ChatbotService],
  exports: [AiService, DamageDetectionService, ChatbotService],
})
export class AiModule {}





