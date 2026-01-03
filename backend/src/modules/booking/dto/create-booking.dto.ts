import { IsString, IsDateString, IsNumber, IsOptional, IsEnum, IsBoolean, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus, DepositDecisionSource } from '@prisma/client';

export class CreateBookingDto {
  @ApiProperty()
  @IsString()
  agencyId: string;

  @ApiProperty()
  @IsString()
  vehicleId: string;

  @ApiProperty()
  @IsString()
  clientId: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiProperty()
  @IsNumber()
  totalPrice: number;

  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  // ============================================
  // CAUTION - Définie à la réservation
  // ============================================
  @ApiPropertyOptional({ description: 'Caution requise pour cette réservation' })
  @IsOptional()
  @IsBoolean()
  depositRequired?: boolean;

  @ApiPropertyOptional({ description: 'Montant de la caution (obligatoire si depositRequired = true)' })
  @ValidateIf((o) => o.depositRequired === true)
  @IsNumber()
  depositAmount?: number;

  @ApiPropertyOptional({ 
    enum: DepositDecisionSource,
    description: 'Source de décision de la caution (COMPANY ou AGENCY) - obligatoire si depositRequired = true'
  })
  @ValidateIf((o) => o.depositRequired === true)
  @IsEnum(DepositDecisionSource)
  depositDecisionSource?: DepositDecisionSource;
}





