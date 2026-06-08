import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyResetOtpDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'OTP code from the password reset email',
  })
  @IsString()
  @Length(6, 6)
  otp: string;
}
