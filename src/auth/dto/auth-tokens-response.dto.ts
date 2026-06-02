import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensResponseDto {
  @ApiProperty({ description: 'New Supabase JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'New Supabase refresh token (store securely)' })
  refreshToken: string;

  @ApiProperty({
    description: 'Seconds until the access token expires',
    example: 3600,
  })
  expiresIn: number;
}
