import { IsString, IsOptional, IsEmail, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingNumberMode, CompanyLegalForm } from '@prisma/client';

export class CreateCompanyDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Raison sociale' })
  @IsString()
  raisonSociale: string;

  @ApiProperty({ description: 'Identifiant légal (SIREN / ICE / RC)' })
  @IsString()
  identifiantLegal: string;

  @ApiProperty({ enum: CompanyLegalForm })
  @IsEnum(CompanyLegalForm)
  formeJuridique: CompanyLegalForm;

  @ApiPropertyOptional({ description: 'Nombre max d’agences (null = illimité)', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxAgencies?: number;

  @ApiPropertyOptional({ enum: BookingNumberMode, description: 'Mode BookingNumber (V2)' })
  @IsOptional()
  @IsEnum(BookingNumberMode)
  bookingNumberMode?: BookingNumberMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  adminEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminName?: string;
}



