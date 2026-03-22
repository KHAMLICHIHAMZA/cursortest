import { ApiPropertyOptional } from "@nestjs/swagger";
import { ModuleCode } from "@prisma/client";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class UpdateCompanySubscriptionDto {
  @ApiPropertyOptional({
    description: "Nouveau plan a appliquer (sinon plan actuel)",
  })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional({ description: "Nombre max d agences", minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxAgencies?: number;

  @ApiPropertyOptional({
    description: "Modules additionnels (hors pack) a appliquer",
    type: [String],
    enum: ModuleCode,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ModuleCode, { each: true })
  additionalModuleCodes?: ModuleCode[];
}
