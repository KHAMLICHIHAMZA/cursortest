import { IsEnum, IsDate, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus, BillingPeriod } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ description: 'Statut de l\'abonnement', enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ description: 'Périodicité de facturation', enum: BillingPeriod })
  @IsOptional()
  @IsEnum(BillingPeriod)
  billingPeriod?: BillingPeriod;

  @ApiPropertyOptional({ description: 'Date de début' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Date de fin' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Montant de l\'abonnement' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}


