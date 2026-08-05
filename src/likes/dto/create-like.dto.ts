import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateLikeDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  askId: string;
}
