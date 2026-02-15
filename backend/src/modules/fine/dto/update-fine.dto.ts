import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const FINE_STATUSES = ['RECUE', 'CLIENT_IDENTIFIE', 'TRANSMISE', 'CONTESTEE', 'CLOTUREE'] as const;

export class UpdateFineDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiPropertyOptional({ description: 'Fine status', enum: FINE_STATUSES })
  @IsOptional()
  @IsString()
  @IsIn(FINE_STATUSES)
  status?: string;

  @ApiPropertyOptional({ description: 'Date of infraction (ISO string)' })
  @IsOptional()
  @IsString()
  infractionDate?: string;
}



