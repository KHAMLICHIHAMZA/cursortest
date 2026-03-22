import { IsString, IsOptional, IsInt, Min, IsObject } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AgencyAddressDetailsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  line1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;
}

export class CreateAgencyDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ type: AgencyAddressDetailsDto })
  @IsOptional()
  @IsObject()
  addressDetails?: AgencyAddressDetailsDto;

  @ApiPropertyOptional({
    description:
      'Horaires d ouverture par jour (ex: {"monday":{"isOpen":true,"openTime":"09:00","closeTime":"18:00"}})',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  openingHours?: Record<
    string,
    { isOpen: boolean; openTime?: string; closeTime?: string }
  >;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional({
    description: "Temps de préparation après retour (en minutes, > 0)",
    default: 60,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  preparationTimeMinutes?: number;
}
