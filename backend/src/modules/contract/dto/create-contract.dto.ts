import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContractDto {
  @ApiProperty({ description: 'Booking ID for the contract' })
  @IsString()
  bookingId: string;

  @ApiProperty({ description: 'Template ID to use for the contract', required: false })
  @IsString()
  @IsOptional()
  templateId?: string;
}

export class SignContractDto {
  @ApiProperty({ description: 'Base64 encoded signature image' })
  @IsString()
  signatureData: string;

  @ApiProperty({ description: 'Signer type: client or agent', enum: ['client', 'agent'] })
  @IsString()
  @IsIn(['client', 'agent'], { message: 'signerType doit être "client" ou "agent"' })
  signerType: 'client' | 'agent';

  @ApiProperty({ description: 'Device info for audit' })
  @IsString()
  @IsOptional()
  deviceInfo?: string;
}
