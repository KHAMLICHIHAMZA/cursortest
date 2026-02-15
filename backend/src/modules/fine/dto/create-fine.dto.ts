import { IsString, IsNumber, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const FINE_STATUSES = ['RECUE', 'CLIENT_IDENTIFIE', 'TRANSMISE', 'CONTESTEE', 'CLOTUREE'] as const;

export class CreateFineDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  agencyId: string;

  @ApiPropertyOptional({ description: 'Optional if registrationNumber + infractionDate provided for auto-identification' })
  @IsOptional()
  @IsString()
  bookingId?: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

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

  @ApiPropertyOptional({ description: 'Date of infraction (ISO string) - used for auto-identification with registrationNumber' })
  @IsOptional()
  @IsString()
  infractionDate?: string;

  @ApiPropertyOptional({ description: 'Vehicle registration number - used for auto-identification with infractionDate' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ description: 'Fine status', enum: FINE_STATUSES, default: 'RECUE' })
  @IsOptional()
  @IsString()
  @IsIn(FINE_STATUSES)
  status?: string;
}



