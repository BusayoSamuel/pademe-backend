import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreatePaymentSheetDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Ask to pay for. Must be in meet_complete status.',
  })
  @IsUUID()
  askId: string;
}
