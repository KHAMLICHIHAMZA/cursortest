import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetPlanningDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agencyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  start?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  end?: string;
}





