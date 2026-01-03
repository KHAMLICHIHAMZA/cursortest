import { IsString, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DepositAction {
  HOLD = 'hold',
  RETURN = 'return',
}

export class HandleDepositDto {
  @ApiProperty()
  @IsString()
  paymentId: string;

  @ApiProperty({ enum: DepositAction })
  @IsEnum(DepositAction)
  action: DepositAction;

  @ApiProperty()
  @IsNumber()
  amount: number;
}





