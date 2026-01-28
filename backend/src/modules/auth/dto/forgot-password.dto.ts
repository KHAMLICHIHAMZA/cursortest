import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'agency',
    required: false,
    enum: ['web', 'admin', 'agency'],
  })
  @IsOptional()
  @IsIn(['web', 'admin', 'agency'])
  client?: 'web' | 'admin' | 'agency';
}
