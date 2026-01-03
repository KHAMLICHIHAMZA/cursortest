import { Injectable } from '@nestjs/common';
import { DamageDetectionService } from './damage-detection.service';
import { ChatbotService } from './chatbot.service';

@Injectable()
export class AiService {
  constructor(
    private damageDetectionService: DamageDetectionService,
    private chatbotService: ChatbotService,
  ) {}

  getDamageDetectionService(): DamageDetectionService {
    return this.damageDetectionService;
  }

  getChatbotService(): ChatbotService {
    return this.chatbotService;
  }
}





