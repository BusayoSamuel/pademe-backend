import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreatePaymentSheetDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  askId: string;
}
