import { ApiProperty } from '@nestjs/swagger';
import { AskStatus } from '../../asks/entities/ask.entity';

export class ConfirmPaymentSheetResponseDto {
  @ApiProperty({ format: 'uuid' })
  askId: string;

  @ApiProperty({ enum: AskStatus })
  status: AskStatus;

  @ApiProperty({
    required: false,
    description: 'Present after confirm hold; true when funds are escrowed',
  })
  paymentHeld?: boolean;
}
