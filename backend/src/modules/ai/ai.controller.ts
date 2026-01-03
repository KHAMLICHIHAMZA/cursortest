import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { DamageDetectionService } from './damage-detection.service';
import { ChatbotService } from './chatbot.service';
import { DetectDamageDto } from './dto/detect-damage.dto';
import { ChatbotQuestionDto } from './dto/chatbot-question.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly damageDetectionService: DamageDetectionService,
    private readonly chatbotService: ChatbotService,
  ) {}

  @Post('damage/detect')
  @ApiOperation({ summary: 'Detect damage in vehicle image' })
  async detectDamage(@Body() dto: DetectDamageDto) {
    return this.damageDetectionService.detectDamage(
      dto.imageUrl,
      dto.vehicleId,
      dto.bookingId,
    );
  }

  @Post('damage/detect-batch')
  @ApiOperation({ summary: 'Detect damage in multiple images' })
  async detectDamageBatch(@Body() dto: { imageUrls: string[]; vehicleId: string; bookingId: string }) {
    return this.damageDetectionService.detectDamageBatch(
      dto.imageUrls,
      dto.vehicleId,
      dto.bookingId,
    );
  }

  @Post('chatbot/question')
  @ApiOperation({ summary: 'Ask a question to the chatbot' })
  async askQuestion(@Body() dto: ChatbotQuestionDto, @Query('userId') userId?: string) {
    return this.chatbotService.answerQuestion(dto.question, {
      userId,
      companyId: dto.companyId,
      agencyId: dto.agencyId,
      bookingId: dto.bookingId,
    });
  }

  @Get('chatbot/faq')
  @ApiOperation({ summary: 'Get FAQ' })
  async getFAQ() {
    return this.chatbotService.getFAQ();
  }
}





