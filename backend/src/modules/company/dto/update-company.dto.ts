import { IsString, IsOptional, IsBoolean, IsEnum, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyLegalForm } from '@prisma/client';

export class UpdateCompanyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Raison sociale' })
  @IsOptional()
  @IsString()
  raisonSociale?: string;

  @ApiPropertyOptional({ description: 'Identifiant légal (SIREN / ICE / RC)' })
  @IsOptional()
  @IsString()
  identifiantLegal?: string;

  @ApiPropertyOptional({ enum: CompanyLegalForm })
  @IsOptional()
  @IsEnum(CompanyLegalForm)
  formeJuridique?: CompanyLegalForm;

  @ApiPropertyOptional({ description: 'Nombre max d’agences (null = illimité)', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxAgencies?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}



