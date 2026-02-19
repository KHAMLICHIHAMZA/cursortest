import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsObject, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ModuleCode } from '@prisma/client';

export class UpdatePlanDto {
  @ApiPropertyOptional({ description: 'Nom du plan' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description du plan' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Prix mensuel du plan' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Plan actif ou non' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Modules inclus dans le plan', type: [String], enum: ModuleCode })
  @IsOptional()
  @IsArray()
  moduleCodes?: ModuleCode[];

  @ApiPropertyOptional({ description: 'Quotas du plan (ex: { agencies: 5, users: 20 })' })
  @IsOptional()
  @IsObject()
  quotas?: Record<string, number>;
}


