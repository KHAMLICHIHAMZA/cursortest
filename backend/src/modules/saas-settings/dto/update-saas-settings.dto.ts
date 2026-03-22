import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional, Min } from "class-validator";

export class UpdateSaasSettingsDto {
  @ApiPropertyOptional({
    description: "Prix par agence supplementaire (MAD/mois)",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  extraAgencyPriceMad?: number;

  @ApiPropertyOptional({
    description: "Prix par module supplementaire (MAD/mois)",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  extraModulePriceMad?: number;

  @ApiPropertyOptional({
    description: "Autoriser le depassement du quota agences a la creation",
  })
  @IsOptional()
  @IsBoolean()
  allowAgencyOverageOnCreate?: boolean;

  @ApiPropertyOptional({
    description: "Autoriser l ajout de modules hors pack a la creation",
  })
  @IsOptional()
  @IsBoolean()
  allowAdditionalModulesOnCreate?: boolean;

  @ApiPropertyOptional({
    description: "Palier kilometrage (km) pour alerte maintenance automatique",
  })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  maintenanceMileageAlertIntervalKm?: number;
}
