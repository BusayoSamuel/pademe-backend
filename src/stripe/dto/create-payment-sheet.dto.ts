import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreatePaymentSheetDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Ask to collect escrow payment for. Must have an assigned doer and no held payment yet.',
  })
  @IsUUID()
  askId: string;
}
