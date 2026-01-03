import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentStatus } from '@prisma/client';

export class UpdateIncidentStatusDto {
  @ApiProperty({ enum: IncidentStatus })
  @IsEnum(IncidentStatus)
  status: IncidentStatus;

  @ApiPropertyOptional({ description: 'Justification si passage à DISPUTED (min 10 caractères)' })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'La justification doit contenir au moins 10 caractères' })
  justification?: string;
}


