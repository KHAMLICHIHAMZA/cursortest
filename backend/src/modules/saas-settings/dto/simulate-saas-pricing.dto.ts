import { ApiPropertyOptional } from "@nestjs/swagger";
import { ModuleCode } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";

export class SimulateSaasPricingDto {
  @ApiPropertyOptional({
    description: "Plan cible pour la simulation",
  })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional({
    description:
      "Nombre d'agences souhaité (null/undefined = quota plan ou non défini)",
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxAgencies?: number;

  @ApiPropertyOptional({
    description: "Modules additionnels demandés hors pack",
    enum: ModuleCode,
    isArray: true,
  })
  @IsOptional()
  @IsEnum(ModuleCode, { each: true })
  additionalModuleCodes?: ModuleCode[];
}
