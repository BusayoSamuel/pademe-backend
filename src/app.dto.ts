import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: 'pademe-backend' })
  app: string;

  @ApiProperty({ example: 'development' })
  env: string;
}
