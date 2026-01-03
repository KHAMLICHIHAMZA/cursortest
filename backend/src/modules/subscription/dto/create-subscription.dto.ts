import { IsString, IsEnum, IsDate, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BillingPeriod } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'ID de la Company' })
  @IsString()
  companyId: string;

  @ApiProperty({ description: 'ID du Plan' })
  @IsString()
  planId: string;

  @ApiProperty({
    description: 'Périodicité de facturation',
    enum: BillingPeriod,
    default: BillingPeriod.MONTHLY,
  })
  @IsEnum(BillingPeriod)
  billingPeriod: BillingPeriod;

  @ApiProperty({ description: 'Date de début de l\'abonnement' })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ description: 'Montant de l\'abonnement (optionnel, utilise le prix du plan par défaut)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}


