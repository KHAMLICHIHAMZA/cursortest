import { ApiProperty } from '@nestjs/swagger';
import { ModuleCode } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class CreateModuleDependencyDto {
  @ApiProperty({ enum: ModuleCode })
  @IsEnum(ModuleCode)
  moduleCode: ModuleCode;

  @ApiProperty({ enum: ModuleCode })
  @IsEnum(ModuleCode)
  dependsOnCode: ModuleCode;
}

