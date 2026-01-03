import { IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DetectDamageDto {
  @ApiProperty()
  @IsUrl()
  imageUrl: string;

  @ApiProperty()
  @IsString()
  vehicleId: string;

  @ApiProperty()
  @IsString()
  bookingId: string;
}





