import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Supabase refresh token from register or prior refresh' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
