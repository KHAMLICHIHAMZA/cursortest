import {
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DepositStatusCheckIn } from '@prisma/client';

export enum FuelLevel {
  EMPTY = 'EMPTY',
  QUARTER = 'QUARTER',
  HALF = 'HALF',
  THREE_QUARTERS = 'THREE_QUARTERS',
  FULL = 'FULL',
}

export enum DamageZone {
  FRONT = 'FRONT',
  REAR = 'REAR',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  ROOF = 'ROOF',
  INTERIOR = 'INTERIOR',
  WHEELS = 'WHEELS',
  WINDOWS = 'WINDOWS',
}

export enum DamageType {
  SCRATCH = 'SCRATCH',
  DENT = 'DENT',
  BROKEN = 'BROKEN',
  PAINT = 'PAINT',
  GLASS = 'GLASS',
  OTHER = 'OTHER',
}

export enum DamageSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum ExtractionStatus {
  OK = 'OK',
  TO_VERIFY = 'TO_VERIFY',
}

export enum DepositType {
  CASH = 'CASH',
  CARD_HOLD = 'CARD_HOLD',
  TRANSFER = 'TRANSFER',
  CHEQUE = 'CHEQUE',
  OTHER = 'OTHER',
}

export enum DepositStatus {
  PENDING = 'PENDING',
  COLLECTED = 'COLLECTED',
  REFUNDED = 'REFUNDED',
  PARTIAL = 'PARTIAL',
  FORFEITED = 'FORFEITED',
}

export class DamageDto {
  @ApiProperty({ enum: DamageZone })
  @IsEnum(DamageZone)
  zone: DamageZone;

  @ApiProperty({ enum: DamageType })
  @IsEnum(DamageType)
  type: DamageType;

  @ApiProperty({ enum: DamageSeverity })
  @IsEnum(DamageSeverity)
  severity: DamageSeverity;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  photos: string[];
}

export class CheckInDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  odometerStart: number;

  @ApiProperty({ enum: FuelLevel })
  @IsEnum(FuelLevel)
  fuelLevelStart: FuelLevel;

  @ApiProperty({ type: [String], description: 'Minimum 4 photos required' })
  @IsArray()
  @ArrayMinSize(4)
  @IsString({ each: true })
  photosBefore: string[];

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  notesStart?: string;

  @ApiPropertyOptional({ type: [DamageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DamageDto)
  existingDamages?: DamageDto[];

  @ApiProperty()
  @IsString()
  driverLicensePhoto: string;

  @ApiProperty()
  @IsDateString()
  driverLicenseExpiry: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  identityDocument?: string;

  @ApiPropertyOptional({ enum: ExtractionStatus })
  @IsOptional()
  @IsEnum(ExtractionStatus)
  extractionStatus?: ExtractionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  depositRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  depositAmount?: number;

  @ApiPropertyOptional({ enum: DepositType })
  @IsOptional()
  @IsEnum(DepositType)
  depositType?: DepositType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  depositDate?: string;

  @ApiPropertyOptional({ 
    enum: DepositStatusCheckIn,
    description: 'Statut de la caution au check-in (PENDING ou COLLECTED)'
  })
  @IsOptional()
  @IsEnum(DepositStatusCheckIn)
  depositStatusCheckIn?: DepositStatusCheckIn;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  depositReference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  depositDocument?: string;

  @ApiProperty({ description: 'Base64 signature' })
  @IsString()
  signature: string;
}

