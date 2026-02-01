import { IsString, IsDateString, IsNumber, IsOptional, IsEnum, IsBoolean, ValidateIf, Matches, MaxLength, MinLength } from 'class-validator';
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
  // V2: BookingNumber (MANUAL uniquement)
  // ============================================
  @ApiPropertyOptional({
    description:
      'Numéro de réservation (V2). Requis si la company est en mode MANUAL. Format: alphanumérique.',
    maxLength: 32,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9]+$/, {
    message: 'bookingNumber must be alphanumeric (A-Z, 0-9) with no spaces',
  })
  bookingNumber?: string;

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





