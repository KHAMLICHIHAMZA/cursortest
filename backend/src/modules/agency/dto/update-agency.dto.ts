import { IsString, IsOptional, IsInt, Min, IsObject } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { AgencyAddressDetailsDto } from "./create-agency.dto";

export class UpdateAgencyDto {
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

  @ApiPropertyOptional({
    description: "Temps de préparation après retour (en minutes, > 0)",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  preparationTimeMinutes?: number;
}
