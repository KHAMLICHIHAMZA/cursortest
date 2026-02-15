import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleStatus } from '@prisma/client';

export class CreateVehicleDto {
  @ApiProperty()
  @IsString()
  brand: string;

  @ApiProperty()
  @IsString()
  model: string;

  @ApiProperty()
  @IsString()
  registrationNumber: string;

  @ApiProperty()
  @IsString()
  agencyId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  mileage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fuel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gearbox?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  dailyRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  depositAmount?: number;

  @ApiPropertyOptional({ enum: VehicleStatus })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  horsepower?: number;

  @ApiPropertyOptional({ description: 'Prix d\'achat du vehicule' })
  @IsOptional()
  @IsNumber()
  purchasePrice?: number;

  @ApiPropertyOptional({ description: 'Date d\'acquisition du vehicule (ISO string)' })
  @IsOptional()
  @IsString()
  acquisitionDate?: string;

  @ApiPropertyOptional({ description: 'Duree d\'amortissement en annees (defaut 5)' })
  @IsOptional()
  @IsNumber()
  amortizationYears?: number;

  @ApiPropertyOptional({ description: 'Mode de financement: CASH, CREDIT ou MIXED' })
  @IsOptional()
  @IsString()
  financingType?: string;

  @ApiPropertyOptional({ description: 'Apport / avance initiale (MAD)' })
  @IsOptional()
  @IsNumber()
  downPayment?: number;

  @ApiPropertyOptional({ description: 'Mensualite du credit (MAD)' })
  @IsOptional()
  @IsNumber()
  monthlyPayment?: number;

  @ApiPropertyOptional({ description: 'Duree du credit en mois' })
  @IsOptional()
  @IsNumber()
  financingDurationMonths?: number;

  @ApiPropertyOptional({ description: 'Date debut du credit (ISO string)' })
  @IsOptional()
  @IsString()
  creditStartDate?: string;

  @ApiPropertyOptional({ description: 'Identifiant / numero de serie du tracker GPS' })
  @IsOptional()
  @IsString()
  gpsTrackerId?: string;

  @ApiPropertyOptional({ description: 'Description du tracker (ex: Mini GPS noir coffre)' })
  @IsOptional()
  @IsString()
  gpsTrackerLabel?: string;
}

