import { ApiProperty } from '@nestjs/swagger';

export class PaymentSheetResponseDto {
  @ApiProperty({
    example: 'pk_test_...',
    description: 'Stripe publishable key for the mobile Payment Sheet.',
  })
  publishableKey: string;

  @ApiProperty({
    example: 'pi_...',
    description: 'PaymentIntent id — pass to POST /stripe/payment-sheet/confirm.',
  })
  paymentIntentId: string;

  @ApiProperty({
    example: 'pi_..._secret_...',
    description: 'Client secret for initializing the mobile Payment Sheet.',
  })
  paymentIntentClientSecret: string;
}
