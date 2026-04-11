import { IsString, IsDateString, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CheckAvailabilityDto {
  @ApiProperty()
  @IsString()
  vehicleId: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  /** Lors de l’édition d’une réservation, exclure ce booking du calcul (sinon le créneau se bloque lui-même). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  excludeBookingId?: string;
}
