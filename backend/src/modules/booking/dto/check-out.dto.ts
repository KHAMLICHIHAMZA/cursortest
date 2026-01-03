import {
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsOptional,
  IsBoolean,
  Min,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FuelLevel, DamageZone, DamageType, DamageSeverity } from './check-in.dto';

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

export class CheckOutDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  odometerEnd: number;

  @ApiProperty({ enum: FuelLevel })
  @IsEnum(FuelLevel)
  fuelLevelEnd: FuelLevel;

  @ApiProperty({ type: [String], description: 'Minimum 4 photos required' })
  @IsArray()
  @ArrayMinSize(4)
  @IsString({ each: true })
  photosAfter: string[];

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  notesEnd?: string;

  @ApiPropertyOptional({ type: [DamageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DamageDto)
  newDamages?: DamageDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  extraFees?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lateFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  damageFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cashCollected?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cashAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cashReceipt?: string;

  @ApiProperty({ description: 'Base64 signature' })
  @IsString()
  returnSignature: string;
}

