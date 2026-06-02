import { ApiProperty } from '@nestjs/swagger';

export class AuthRegisterResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'jane@example.com' })
  email: string;

  @ApiProperty({ description: 'Supabase JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'Supabase refresh token' })
  refreshToken: string;
}
