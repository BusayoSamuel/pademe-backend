import { ApiProperty } from '@nestjs/swagger';

export class AuthMessageResponseDto {
  @ApiProperty({ example: 'Signed out successfully' })
  message: string;
}
