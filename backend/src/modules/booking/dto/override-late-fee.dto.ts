import { IsNumber, IsString, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OverrideLateFeeDto {
  @ApiProperty({ description: 'Nouveau montant des frais de retard (override)' })
  @IsNumber()
  @Min(0)
  newAmount: number;

  @ApiProperty({ description: 'Justification obligatoire pour l\'override (min 10 caractères)' })
  @IsString()
  @IsNotEmpty()
  @Min(10, { message: 'La justification doit contenir au moins 10 caractères' })
  justification: string;
}


