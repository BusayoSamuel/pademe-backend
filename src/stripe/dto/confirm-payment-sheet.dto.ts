import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class ConfirmPaymentSheetDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Ask that was paid for via Payment Sheet.',
  })
  @IsUUID()
  askId: string;

  @ApiProperty({
    example: 'pi_...',
    description: 'PaymentIntent id returned by POST /stripe/payment-sheet.',
  })
  @IsString()
  paymentIntentId: string;
}
