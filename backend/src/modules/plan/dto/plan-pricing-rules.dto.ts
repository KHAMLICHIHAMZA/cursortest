import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional, Min } from "class-validator";

export class PlanPricingRulesDto {
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
    description: "Autoriser depassement quota agences a la creation",
  })
  @IsOptional()
  @IsBoolean()
  allowAgencyOverageOnCreate?: boolean;

  @ApiPropertyOptional({
    description: "Autoriser modules additionnels a la creation",
  })
  @IsOptional()
  @IsBoolean()
  allowAdditionalModulesOnCreate?: boolean;
}
