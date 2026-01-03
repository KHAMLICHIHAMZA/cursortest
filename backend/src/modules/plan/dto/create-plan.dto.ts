import { IsString, IsNumber, IsArray, IsOptional, IsObject, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ModuleCode } from '@prisma/client';

export class CreatePlanDto {
  @ApiProperty({ description: 'Nom du plan (ex: Starter, Pro, Enterprise)' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description du plan', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Prix mensuel du plan' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Modules inclus dans le plan', type: [String], enum: ModuleCode })
  @IsArray()
  @IsOptional()
  moduleCodes?: ModuleCode[];

  @ApiProperty({ description: 'Quotas du plan (ex: { max_agencies: 5, max_users: 20 })', required: false })
  @IsOptional()
  @IsObject()
  quotas?: Record<string, number>;
}


