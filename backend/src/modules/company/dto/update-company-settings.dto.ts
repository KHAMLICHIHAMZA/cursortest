import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookingNumberMode } from '@prisma/client';

export class UpdateCompanySettingsDto {
  @ApiPropertyOptional({ enum: BookingNumberMode, description: 'Mode BookingNumber (V2)' })
  @IsOptional()
  @IsEnum(BookingNumberMode)
  bookingNumberMode?: BookingNumberMode;
}

