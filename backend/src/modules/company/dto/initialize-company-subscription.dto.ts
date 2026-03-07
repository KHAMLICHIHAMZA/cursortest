import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModuleCode } from '@prisma/client';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class InitializeCompanySubscriptionDto {
  @ApiProperty({ description: 'ID du plan a appliquer a l entreprise' })
  @IsString()
  planId: string;

  @ApiPropertyOptional({ description: 'Nombre max d agences (null/undefined = illimite)', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxAgencies?: number;

  @ApiPropertyOptional({
    description: 'Modules additionnels a activer en plus du plan',
    type: [String],
    enum: ModuleCode,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ModuleCode, { each: true })
  additionalModuleCodes?: ModuleCode[];
}

